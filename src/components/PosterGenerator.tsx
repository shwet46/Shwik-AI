// First we need to properly import the TextItem type from pdfjs
"use client";
import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { Upload, FileText, Link, Download, Edit, Loader2, Copy } from "lucide-react";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// Import the TextItem interface from pdfjs
import { TextItem } from "pdfjs-dist/types/src/display/api";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

type TabType = "document" | "link" | "text";

interface PosterData {
  title: string;
  imageUrl: string;
  timestamp: string;
  content?: string;
}

const PosterGenerator = () => {
  const [activeTab, setActiveTab] = useState<TabType>("document");
  const [content, setContent] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [referenceLink, setReferenceLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [generatedPoster, setGeneratedPoster] = useState<PosterData | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>("/api/placeholder/800/600");
  const [posterTitle, setPosterTitle] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_CHARACTERS = 25000;

  // Handle drag and drop functionality
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      setError("");
      await processFile(file);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARACTERS) {
      setContent(newContent);
      setError("");
    } else {
      setContent(newContent.slice(0, MAX_CHARACTERS));
      setError(`Text exceeds maximum limit of ${MAX_CHARACTERS} characters.`);
    }
  };

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    setReferenceLink(e.target.value);
  };

  // Process uploaded files
  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      let extractedText = "";

      if (file.type.includes("text/plain")) {
        extractedText = await file.text();
      } else if (file.type.includes("application/pdf")) {
        extractedText = await extractPdfText(file);
      } else if (
        file.type.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        extractedText = await extractDocxText(file);
      } else if (
        file.type.includes("application/vnd.ms-powerpoint") ||
        file.type.includes(
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
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
      setPosterTitle(file.name.split('.')[0]); // Set poster title to filename without extension
    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to process file: ${errorMessage}`);
      setFileContent("");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract text from PDF files - FIXED TYPE ISSUE HERE
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      const pageLimit = Math.min(pdf.numPages, 50);

      for (let i = 1; i <= pageLimit; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is TextItem => 
            'str' in item && typeof item.str === 'string'
          )
          .map((item) => item.str)
          .join(" ");

        fullText += pageText + "\n";

        if (fullText.length > MAX_CHARACTERS) {
          fullText = fullText.slice(0, MAX_CHARACTERS);
          break;
        }
      }

      if (pdf.numPages > 50) {
        fullText += "\n[Document truncated due to length...]";
      }

      return fullText;
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error("Could not extract text from PDF");
    }
  };

  // Extract text from DOCX files
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

  // Extract text from PPTX files
  const extractPptxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let text = "";

      for (const fileName of Object.keys(zip.files)) {
        if (fileName.startsWith("ppt/slides/slide") && fileName.endsWith(".xml")) {
          const slideContent = await zip.files[fileName].async("text");
          const matches = slideContent.match(/<a:t>(.*?)<\/a:t>/g);
          if (matches) {
            text += matches.map((match) => match.replace(/<\/?a:t>/g, "")).join(" ");
          }
        }
      }

      return text || "[No readable content found in PowerPoint file]";
    } catch (error) {
      console.error("PPTX extraction error:", error);
      throw new Error("Could not extract text from PowerPoint file");
    }
  };

  // Generate poster from text or URL
  const generatePoster = async (): Promise<void> => {
    setError("");
    setGeneratedPoster(null);

    let contentToProcess = "";
    
    if (activeTab === "document") {
      contentToProcess = fileContent;
      if (!contentToProcess.trim()) {
        setError("Please upload a document first.");
        return;
      }
    } else if (activeTab === "link") {
      if (!referenceLink.trim()) {
        setError("Please enter a valid URL.");
        return;
      }
    
      setIsLoading(true);
      try {
        contentToProcess = `Content extracted from ${referenceLink}. This is simulated content for demo purposes.`;
        setPosterTitle(new URL(referenceLink).hostname);
      } catch (error) {
        setError("Failed to fetch content from URL. Please check the URL and try again.");
        setIsLoading(false);
        return;
      }
    } else { // text input
      contentToProcess = content;
      if (!contentToProcess.trim()) {
        setError("Please enter some text first.");
        return;
      }
      setPosterTitle("Text Poster");
    }

    setIsLoading(true);

    try {
      // In a real implementation, you would use the actual API key
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "SIMULATED_API_KEY";
      
      // Create a simulated response if no API key
      if (apiKey === "SIMULATED_API_KEY") {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a sample poster response
        const posterData: PosterData = {
          title: posterTitle || "Generated Poster",
          imageUrl: "/api/placeholder/800/600",
          timestamp: new Date().toLocaleString()
        };
        
        setGeneratedPoster(posterData);
        setPosterUrl(posterData.imageUrl);
      } else {
        // Actual implementation with Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = "gemini-1.5-pro";
        const model: GenerativeModel = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Generate a visually appealing poster based on the following content. 
        Extract key information, main themes, and important points. 
        Design should be professional with a clear layout, appropriate typography, and visual elements.
        Content: ${contentToProcess.substring(0, 5000)}`;

        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();
        
        // In a real implementation, Gemini would return poster content or image data
        // You would process this to create an actual poster
        // Here we're simulating with a placeholder
        const posterData: PosterData = {
          title: posterTitle || "Generated Poster",
          imageUrl: "/api/placeholder/800/600",
          timestamp: new Date().toLocaleString(),
          content: generatedText
        };
        
        setGeneratedPoster(posterData);
        setPosterUrl(posterData.imageUrl);
      }
    } catch (error) {
      console.error("Error generating poster:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to generate poster: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDownloadPDF = () => {
    if (generatedPoster) {
      // In a real implementation, this would convert the poster to PDF
      // For now, we'll simulate a download
      const blob = new Blob([`Poster: ${posterTitle}\nGenerated: ${new Date().toLocaleString()}`], 
                           { type: "text/plain" });
      saveAs(blob, `${posterTitle}-poster.pdf`);
    }
  };

  const openInCanva = () => {
    // In a real implementation, this would open the poster in Canva
    window.open("https://www.canva.com/create/posters/", "_blank");
  };

  const handleCopyLink = () => {
    if (generatedPoster) {
      // In a real implementation, this would copy a shareable link
      navigator.clipboard.writeText(`https://yourdomain.com/posters/${posterTitle}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  useEffect(() => {
    // Reset generated poster when switching tabs
    setGeneratedPoster(null);
  }, [activeTab]);

  return (
    <div className="w-full items-center max-w-4xl mx-auto p-4">
      {/* Tabs */}
      <div className="mb-4 flex rounded-full items-center bg-sky-100 p-1 w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === "document" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
        >
          Document
        </button>
        <button
          onClick={() => setActiveTab("link")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === "link" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
        >
          Link
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === "text" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
        >
          Text
        </button>
      </div>

      {/* Content Area */}
      <div className="w-full h-64 bg-amber-50 rounded-lg border-2 border-dashed border-gray-500 mb-4 overflow-hidden">
        {activeTab === "text" ? (
          <textarea
            className="w-full h-full p-4 bg-transparent resize-none outline-none"
            placeholder="Enter your text to generate a poster..."
            value={content}
            onChange={handleTextChange}
            maxLength={MAX_CHARACTERS}
          />
        ) : activeTab === "link" ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <Link size={48} className="text-gray-400 mb-4" />
            <input
              type="url"
              value={referenceLink}
              onChange={handleLinkChange}
              placeholder="https://example.com/article"
              className="w-full max-w-md p-3 mb-4 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter a URL to a webpage, article, or blog post
            </p>
          </div>
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center rounded-lg ${
              isDragging ? "border-blue-500 bg-blue-50" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept=".txt,.pdf,.docx,.ppt,.pptx"
            />
            {isLoading && activeTab === "document" && !generatedPoster ? (
              <div className="text-center">
                <Loader2 size={48} className="text-gray-400 mb-2 animate-spin mx-auto" />
                <p className="text-sm text-gray-600">Processing file...</p>
              </div>
            ) : fileName ? (
              <div className="text-center">
                <FileText size={48} className="text-gray-400 mb-2 mx-auto" />
                <p className="text-sm text-gray-800 font-medium">{fileName}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {fileContent ? `${fileContent.length} / ${MAX_CHARACTERS} characters` : "Processing..."}
                </p>
                <button
                  className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
                  onClick={triggerFileInput}
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <>
                <Upload size={48} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag & drop your document here</p>
                <button
                  className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                  onClick={triggerFileInput}
                >
                  Upload File
                </button>
                <p className="text-xs text-gray-500 mt-2">Supports .txt, .pdf, .docx, .ppt, .pptx</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 text-sm mb-4 px-2">{error}</div>}

      {/* Generate Button */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 mb-4">
        <button
          onClick={generatePoster}
          disabled={isLoading || 
            (activeTab === "document" && !fileContent) || 
            (activeTab === "link" && !referenceLink) ||
            (activeTab === "text" && !content)}
          className={`w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2 text-white rounded-full font-medium border-2 shadow-lg transition-transform ${
            isLoading || 
            (activeTab === "document" && !fileContent) || 
            (activeTab === "link" && !referenceLink) ||
            (activeTab === "text" && !content)
              ? "bg-gray-400 border-gray-500 cursor-not-allowed"
              : "bg-purple-800 border-purple-900 hover:bg-purple-900 hover:scale-105"
          }`}
        >
          {isLoading && !generatedPoster ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Poster...
            </>
          ) : (
            <>
              Generate Poster
            </>
          )}
        </button>
        <div className="text-gray-500 text-sm text-center md:text-right w-full md:w-auto">
          {activeTab === "text"
            ? `${content.length} / ${MAX_CHARACTERS} characters`
            : activeTab === "document" && fileContent
            ? `${fileContent.length} / ${MAX_CHARACTERS} characters`
            : ""}
        </div>
      </div>

      {/* Generated Poster Display */}
      {generatedPoster && (
        <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Generated Poster</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-1"
                title="Copy shareable link"
              >
                <Copy size={16} />
                <span className="text-xs">{copySuccess ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <div className="border rounded-md p-2 bg-gray-50">
                <img
                  src={posterUrl}
                  alt="Generated Poster"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
            
            <div className="md:w-1/3 flex flex-col gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Poster Title</h4>
                <p className="text-gray-800">{posterTitle}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Created</h4>
                <p className="text-gray-600 text-sm">{new Date().toLocaleString()}</p>
              </div>
              
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download PDF
                </button>
                <button
                  onClick={openInCanva}
                  className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={20} />
                  Edit in Canva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterGenerator;