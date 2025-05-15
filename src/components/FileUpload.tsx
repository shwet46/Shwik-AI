"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";
import JSZip from "jszip";
import { motion, AnimatePresence } from "framer-motion";
import Summary from "./Summary";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

export default function FileUpload() {
  const [activeTab, setActiveTab] = useState("text");
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARACTERS = 25000;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARACTERS) {
      setContent(newContent);
      setError("");
    } else {
      setContent(newContent.slice(0, MAX_CHARACTERS));
      setError(`Text exceeds maximum limit of ${MAX_CHARACTERS} characters.`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const files: FileList = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files: FileList | null = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      setError("");
      await processFile(file);
    }
  };

  const processFile = async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      let extractedText = "";

      if (file.type.includes("text/plain")) {
        extractedText = await file.text();
      } else if (file.type.includes("application/pdf")) {
        extractedText = await extractPdfText(file);
      } else if (
        file.type.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      ) {
        extractedText = await extractDocxText(file);
      } else if (
        file.type.includes("application/vnd.ms-powerpoint") ||
        file.type.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")
      ) {
        extractedText = await extractPptxText(file);
      } else {
        throw new Error("Unsupported file type");
      }

      if (extractedText.length > MAX_CHARACTERS) {
        extractedText = extractedText.slice(0, MAX_CHARACTERS);
        setError(
          `File content truncated to ${MAX_CHARACTERS} characters due to length limitations.`
        );
      }

      setFileContent(extractedText);
    } catch (error: unknown) {
      console.error("Error processing file:", error);
      const errorMessage = isErrorWithMessage(error)
        ? error.message
        : "Unknown error";
      setError(`Failed to process file: ${errorMessage}`);
      setFileContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      let fullText = "";
      const pageLimit = Math.min(pdfDoc.numPages, 50);

      for (let i = 1; i <= pageLimit; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from each item properly
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str !== undefined) {
              return item.str;
            }
            return "";
          })
          .join(" ");

        fullText += `Page ${i}: ${pageText}\n\n`;

        if (fullText.length > MAX_CHARACTERS) {
          fullText = fullText.slice(0, MAX_CHARACTERS);
          break;
        }
      }

      if (pdfDoc.numPages > 50) {
        fullText += "\n[Document truncated due to length...]";
      }

      if (!fullText.trim()) {
        // If we couldn't extract text normally, the PDF might be scanned/image-based
        fullText = "[This appears to be a scanned or image-based PDF. Text extraction is limited.]";
      }

      return fullText;
    } catch (error: unknown) {
      console.error("PDF extraction error:", error);
      throw new Error("Could not extract text from PDF");
    }
  };

  const extractDocxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error("DOCX extraction error:", error);
      throw new Error("Could not extract text from DOCX");
    }
  };

  const extractPptxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let text = "";
      let slideCounter = 0;
      const slideContents: { [key: string]: string } = {};

      // First identify all valid slide files and their numbers
      for (const filename of Object.keys(zip.files)) {
        if (filename.match(/ppt\/slides\/slide[0-9]+\.xml$/)) {
          const slideNumMatch = filename.match(/slide([0-9]+)\.xml$/);
          if (slideNumMatch && slideNumMatch[1]) {
            const slideNumber = parseInt(slideNumMatch[1], 10);
            const content = await zip.files[filename].async("string");
            slideContents[slideNumber] = content;
            slideCounter++;
          }
        }
      }

      // Process slides in numerical order
      const slideNumbers = Object.keys(slideContents).map(Number).sort((a, b) => a - b);
      for (const slideNumber of slideNumbers) {
        const content = slideContents[slideNumber];
        let slideText = "";

        // Multiple regex patterns to catch different PowerPoint XML text structures
        const textMatches = [
          ...content.matchAll(/<a:t>([^<]*)<\/a:t>/g),
          ...content.matchAll(/<a:t [^>]*>([^<]*)<\/a:t>/g)
        ];

        if (textMatches && textMatches.length > 0) {
          for (const match of textMatches) {
            if (match[1] && match[1].trim()) {
              slideText += match[1].trim() + " ";
            }
          }
        }

        if (slideText.trim()) {
          text += `Slide ${slideNumber}: ${slideText.trim()}\n\n`;
        }
      }

      if (!text.trim()) {
        return "[No readable text content found in PowerPoint file]";
      }

      return text;
    } catch (error) {
      console.error("PPTX extraction error:", error);
      throw new Error("Could not extract text from PowerPoint file");
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenerate = async (): Promise<void> => {
    setError("");
    setSummary("");
    setShowSummary(false);

    const textToSummarize = activeTab === "text" ? content : fileContent;

    if (!textToSummarize.trim()) {
      setError("Please enter some text or upload a document.");
      return;
    }

    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not found. Please check your environment variables.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `Please provide a concise and comprehensive summary of the following ${activeTab === "text" ? "text" : "document"}.
Focus on the main points, key ideas, and essential information:

${textToSummarize}`;

      const result = await model.generateContent(prompt);
      // Await the text() promise
      const generatedText = await result.response.text();

      setSummary(generatedText);
      setShowSummary(true);
    } catch (error: unknown) {
      console.error("Error generating summary:", error);
      const errorMessage = isErrorWithMessage(error) ? error.message : "Unknown error";
      setError(`Failed to generate summary: ${errorMessage}`);

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setSummary("API Key missing...");
        setShowSummary(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowSummary(false);
  };

  useEffect(() => {
    if (activeTab === "text") {
      setFileContent("");
      setFileName("");
    } else {
      setContent("");
    }
    setSummary("");
    setShowSummary(false);
  }, [activeTab]);

  // Animation variants
  const tabVariants = {
    selected: { 
      backgroundColor: "#fff", 
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      scale: 1
    },
    notSelected: { 
      backgroundColor: "transparent", 
      boxShadow: "none",
      scale: 0.98
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 12 }
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  const loaderVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 } 
    }
  };

  return (
    <motion.div 
      className="w-full items-center max-w-4xl mx-auto p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loader"
            className="flex flex-col items-center justify-center py-16"
            variants={loaderVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="w-20 h-20 flex items-center justify-center mb-6"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Loader2 size={64} className="text-purple-600" />
            </motion.div>
            <motion.h3 
              className="text-xl font-medium text-gray-800 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Generating Summary
            </motion.h3>
            <motion.p 
              className="text-gray-600 text-center max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Our AI is analyzing your {activeTab === "text" ? "text" : "document"} to create a comprehensive summary...
            </motion.p>
          </motion.div>
        ) : showSummary ? (
          <Summary
            key="summary"
            summary={summary}
            sourceType={activeTab}
            fileName={fileName}
            onGoBack={handleGoBack}
          />
        ) : (
          <motion.div 
            key="input"
            className="w-full"
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Tabs */}
            <motion.div 
              className="mb-4 flex rounded-full items-center bg-sky-100 p-1 w-full max-w-md mx-auto"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => setActiveTab("text")}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "text" ? "text-gray-800" : "text-gray-600"
                }`}
                animate={activeTab === "text" ? "selected" : "notSelected"}
                variants={tabVariants}
                whileHover={{ scale: activeTab === "text" ? 1 : 1.02 }}
              >
                Text
              </motion.button>
              <motion.button
                onClick={() => setActiveTab("document")}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "document" ? "text-gray-800" : "text-gray-600"
                }`}
                animate={activeTab === "document" ? "selected" : "notSelected"}
                variants={tabVariants}
                whileHover={{ scale: activeTab === "document" ? 1 : 1.02 }}
              >
                Document
              </motion.button>
            </motion.div>

            {/* Content Area */}
            <motion.div 
              className="w-full h-64 bg-amber-50 rounded-lg border-2 border-dashed border-gray-500 mb-4 overflow-hidden"
              variants={itemVariants}
              animate={{ 
                borderColor: isDragging ? "#3b82f6" : "#6b7280",
                backgroundColor: isDragging ? "#eff6ff" : "#fffbeb" 
              }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "text" ? (
                  <motion.textarea
                    key="text-area"
                    className="w-full h-full p-4 bg-transparent resize-none outline-none"
                    placeholder="Paste in your notes or other content to summarize..."
                    value={content}
                    onChange={handleTextChange}
                    maxLength={MAX_CHARACTERS}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                ) : (
                  <motion.div
                    key="document-upload"
                    className="w-full h-full flex flex-col items-center justify-center rounded-lg"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".txt,.pdf,.docx,.ppt,.pptx"
                    />
                    <AnimatePresence mode="wait">
                      {fileName ? (
                        <motion.div 
                          className="text-center"
                          key="file-info"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            initial={{ rotateY: -180 }}
                            animate={{ rotateY: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <FileText size={48} className="text-gray-400 mb-2 mx-auto" />
                          </motion.div>
                          <p className="text-sm text-gray-800 font-medium">{fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {fileContent ? `${fileContent.length} / ${MAX_CHARACTERS} characters` : "Processing..."}
                          </p>
                          <motion.button
                            className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
                            onClick={triggerFileInput}
                            whileHover="hover"
                            whileTap="tap"
                            variants={buttonVariants}
                          >
                            Choose different file
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="flex flex-col items-center"
                          key="upload-prompt"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            animate={{ 
                              y: [0, -5, 0],
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              repeatType: "reverse", 
                              duration: 1.5,
                              ease: "easeInOut" 
                            }}
                          >
                            <Upload size={48} className="text-gray-400 mb-2" />
                          </motion.div>
                          <p className="text-sm text-gray-600 mb-2">Drag & drop your document here</p>
                          <motion.button
                            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                            onClick={triggerFileInput}
                            whileHover="hover"
                            whileTap="tap"
                            variants={buttonVariants}
                          >
                            Upload File
                          </motion.button>
                          <p className="text-xs text-gray-500 mt-2">Supports .txt, .pdf, .docx, .ppt, .pptx</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="text-red-500 text-sm mb-4 px-2"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Bar */}
            <motion.div 
              className="flex flex-col items-center justify-center w-full gap-4 mb-4"
              variants={itemVariants}
            >
              <motion.button
                onClick={handleGenerate}
                disabled={(activeTab === "text" ? !content : !fileContent)}
                className={`w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2 text-white rounded-full font-medium border-2 shadow-lg ${
                  (activeTab === "text" ? !content : !fileContent)
                    ? "bg-gray-400 border-gray-500 cursor-not-allowed"
                    : "bg-purple-800 border-purple-900 hover:bg-purple-900"
                }`}
                whileHover={
                  (activeTab === "text" ? !content : !fileContent) 
                    ? {} 
                    : { scale: 1.05 }
                }
                whileTap={
                  (activeTab === "text" ? !content : !fileContent) 
                    ? {} 
                    : { scale: 0.98 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FileText size={20} />
                Generate Summary
              </motion.button>
              <motion.div 
                className="text-gray-500 text-sm text-center md:text-right w-full md:w-auto"
                variants={itemVariants}
              >
                {activeTab === "text"
                  ? `${content.length} / ${MAX_CHARACTERS} characters`
                  : fileContent
                  ? `${fileContent.length} / ${MAX_CHARACTERS} characters`
                  : ""}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}