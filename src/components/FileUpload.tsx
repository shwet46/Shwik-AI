"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Copy, Download, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PdfTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

type ErrorWithMessage = {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

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
   
      if (file.type.includes('text/plain')) {

        extractedText = await file.text();
      } else if (file.type.includes('application/pdf')) {

        extractedText = await extractPdfText(file);
      } else if (file.type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {

        extractedText = await extractDocxText(file);
      } else if (file.type.includes('application/vnd.ms-powerpoint') || 
                file.type.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {

        extractedText = `[PowerPoint content from ${file.name}]`;
        setError("PowerPoint processing is limited. Results may vary.");
      } else {
        throw new Error("Unsupported file type");
      }
      
      if (extractedText.length > MAX_CHARACTERS) {
        extractedText = extractedText.slice(0, MAX_CHARACTERS);
        setError(`File content truncated to ${MAX_CHARACTERS} characters due to length limitations.`);
      }
      
      setFileContent(extractedText);
    } catch (error: unknown) {
      console.error("Error processing file:", error);
      const errorMessage = isErrorWithMessage(error) ? error.message : "Unknown error";
      setError(`Failed to process file: ${errorMessage}`);
      setFileContent("");
    } finally {
      setIsLoading(false);
    }
  };

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
          .filter((item): item is PdfTextItem => 
            typeof item === 'object' &&
            item !== null &&
            'str' in item &&
            typeof item.str === 'string'
          )
          .map(item => item.str)
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

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenerate = async (): Promise<void> => {
    setError("");
    setSummary("");

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

      const modelName = "gemini-1.5-pro"; 
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `Please provide a concise and comprehensive summary of the following ${activeTab === "text" ? "text" : "document"}. 
Focus on the main points, key ideas, and essential information:

${textToSummarize}`;
 
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text();
      
      setSummary(generatedText);
    } catch (error: unknown) {
      console.error("Error generating summary:", error);
      const errorMessage = isErrorWithMessage(error) ? error.message : "Unknown error";
      setError(`Failed to generate summary: ${errorMessage}`);
      
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setSummary("API Key missing...");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (summary) {
      const blob = new Blob([summary], { type: "text/plain" });
      const filename = activeTab === "text" 
        ? `text-summary-${new Date().toISOString().slice(0, 10)}.txt`
        : `summary-${fileName.split('.')[0]}-${new Date().toISOString().slice(0, 10)}.txt`;
      
      saveAs(blob, filename);
    }
  };


  useEffect(() => {
    setSummary("");
  }, [activeTab]);

  const ModelSelector = () => (
    <div className="mb-4">
      <select
        className="block w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={() => {
          setError("");
          setSummary("");
        }}
        defaultValue="gemini-pro"
      >
        <option value="gemini-pro">Gemini Pro</option>
        <option value="gemini-pro-vision">Gemini Pro Vision</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">Select model version</p>
    </div>
  );

  return (
    <div className="w-full items-center max-w-4xl mx-auto p-4">
      
      {/* Tabs */}
      <div className="mb-4 flex rounded-full items-center bg-sky-100 p-1 w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === "text" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === "document" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
        >
          Document
        </button>
      </div>

      {/* Content Area */}
      <div className="w-full h-64 bg-amber-50 rounded-lg border-2 border-dashed border-gray-500 mb-4 overflow-hidden">
        {activeTab === "text" ? (
          <textarea
            className="w-full h-full p-4 bg-transparent resize-none outline-none"
            placeholder="Paste in your notes or other content to summarize..."
            value={content}
            onChange={handleTextChange}
            maxLength={MAX_CHARACTERS}
          />
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
            {isLoading && activeTab === "document" && !summary ? (
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
                <p className="text-sm text-gray-600 mb-2">
                  Drag & drop your document here
                </p>
                <button
                  className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                  onClick={triggerFileInput}
                >
                  Upload File
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Supports .txt, .pdf, .docx, .ppt, .pptx
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mb-4 px-2">
          {error}
        </div>
      )}

      {/* API Key Status - for development environments */}
      {process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
        <div className="bg-yellow-100 text-yellow-800 text-sm p-2 mb-4 rounded">
          ⚠️ API Key Missing: Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file
        </div>
      )}

      {/* Model Version Selector */}
      <ModelSelector />

      {/* Bottom Bar */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          onClick={handleGenerate}
          disabled={isLoading || (activeTab === "text" ? !content : !fileContent)}
          className={`px-6 py-3 flex items-center gap-2 text-white rounded-full font-medium border-2 shadow-lg transition-transform ${
            isLoading || (activeTab === "text" ? !content : !fileContent)
              ? "bg-gray-400 border-gray-500 cursor-not-allowed"
              : "bg-purple-800 border-purple-900 hover:bg-purple-900 hover:scale-105"
          }`}
        >
          {isLoading && summary === "" ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <FileText size={20} />
              Generate Summary
            </>
          )}
        </button>
        <div className="text-gray-500 text-sm">
          {activeTab === "text"
            ? `${content.length} / ${MAX_CHARACTERS} characters`
            : fileContent
            ? `${fileContent.length} / ${MAX_CHARACTERS} characters`
            : ""}
        </div>
      </div>

      {/* Summary Display */}
      {summary && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-800">Generated Summary</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-1"
                title="Copy to clipboard"
              >
                <Copy size={16} />
                <span className="text-xs">{copySuccess ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-1"
                title="Download summary"
              >
                <Download size={16} />
                <span className="text-xs">Download</span>
              </button>
            </div>
          </div>
          <div
            ref={summaryRef}
            className="bg-white border border-gray-300 rounded-lg p-4 whitespace-pre-wrap"
          >
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}