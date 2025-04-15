'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Download, Settings } from 'lucide-react';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export default function DocInput() {
  const [currentStep, setCurrentStep] = useState(1);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentFormat, setDocumentFormat] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<Blob | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processError, setProcessError] = useState<string | null>(null);
  const maxChars = 25000;
  
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  interface TextChangeEvent {
    target: {
      value: string;
    };
  }

  const handleTextChange = (e: TextChangeEvent): void => {
    const inputText = e.target.value;
    setText(inputText);
    setCharCount(inputText.length);
  };

  interface FileChangeEvent {
    target: {
      files: FileList | null;
    };
  }

  const handleFileChange = async (e: FileChangeEvent): Promise<void> => {
    setFileError(null);
    setProcessError(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      const fileName = selectedFile.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      // Check if file is PDF or DOCX
      if (
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'pdf' || 
        fileExtension === 'docx'
      ) {
        setFile(selectedFile);
        
        // Determine document format
        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
          setDocumentFormat('pdf');
        } else {
          setDocumentFormat('docx');
          
          // Extract text from DOCX immediately for preview
          try {
            const text = await extractTextFromDocx(selectedFile);
            setExtractedText(text);
          } catch (error) {
            console.error('Error extracting text from DOCX:', error);
            setFileError('Could not extract text from document. It may be corrupted or password-protected.');
          }
        }
      } else {
        setFileError('Please upload only PDF or DOCX files');
        setFile(null);
        setDocumentFormat(null);
      }
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const arrayBuffer = event.target.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(error);
          }
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        try {
          // Import pdf.js dynamically to avoid server-side rendering issues
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const loadingTask = pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => item.str).join(' ');
            fullText += textItems + ' ';
          }
          
          resolve(fullText);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const generateContentWithGemini = async (prompt: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('API key is required to use Gemini');
    }
    
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No content returned from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProcessError(null);
    
    try {
      if (!apiKey) {
        setShowApiKeyModal(true);
        setIsGenerating(false);
        return;
      }
      
      let documentText = '';
      
      // Extract text from document if provided
      if (file) {
        try {
          if (documentFormat === 'docx') {
            documentText = await extractTextFromDocx(file);
          } else if (documentFormat === 'pdf') {
            documentText = await extractTextFromPdf(file);
          }
        } catch (error) {
          console.error('Error extracting text:', error);
          setProcessError('Failed to extract text from document. Please try another file.');
          setIsGenerating(false);
          return;
        }
      }
      
      // Create prompt for Gemini
      const prompt = `
I have a document with the following content:
${documentText}

Based on this content and the following instructions or summary, please generate new content that follows the same structure and format but incorporates these changes:

${text}

Generate content that can replace the original document while maintaining appropriate formatting and structure.
`;
      
      // Generate content using Gemini API
      const generatedText = await generateContentWithGemini(prompt);
      setGeneratedContent(generatedText);
      
      // Create modified document
      if (documentFormat) {
        try {
          const modifiedDocument = await createModifiedDocument(generatedText, documentFormat);
          setGeneratedDocument(modifiedDocument);
        } catch (error) {
          console.error('Error creating document:', error);
          setProcessError('Failed to create modified document.');
          setIsGenerating(false);
          return;
        }
      }
      
      // Move to the results step
      setCurrentStep(4);
    } catch (error: any) {
      console.error('Error in document generation process:', error);
      setProcessError(`Error: ${error.message || 'Something went wrong'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const createModifiedDocument = async (content: string, format: string): Promise<Blob> => {
    if (format === 'docx') {
      // Create DOCX using docx.js
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: content.split('\n').map(paragraph => 
              new Paragraph({
                children: [new TextRun(paragraph)]
              })
            )
          }
        ]
      });
      
      return await Packer.toBlob(doc);
    } else {
      // Create PDF using jsPDF
      const doc = new jsPDF();
      
      const splitText = doc.splitTextToSize(content, 180); // 180 is a good width for A4
      let y = 20; // starting y position
      
      // Add text with proper line breaks
      doc.setFontSize(12);
      for (let i = 0; i < splitText.length; i++) {
        if (y > 280) { // Check if we're near the bottom of the page
          doc.addPage();
          y = 20; // Reset y position for new page
        }
        doc.text(splitText[i], 15, y);
        y += 7; // Increment y position for next line
      }
      
      return doc.output('blob');
    }
  };

  const handleDownload = () => {
    if (!generatedDocument || !documentFormat) return;
    
    const fileName = file 
      ? `modified_${file.name}` 
      : `generated_document.${documentFormat}`;
    
    const url = URL.createObjectURL(generatedDocument);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFileError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileType = droppedFile.type;
      const fileName = droppedFile.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      if (
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'pdf' || 
        fileExtension === 'docx'
      ) {
        setFile(droppedFile);
        
        // Determine document format
        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
          setDocumentFormat('pdf');
        } else {
          setDocumentFormat('docx');
          
          // Extract text for preview
          try {
            const text = await extractTextFromDocx(droppedFile);
            setExtractedText(text);
          } catch (error) {
            console.error('Error extracting text from DOCX:', error);
            setFileError('Could not extract text from document.');
          }
        }
      } else {
        setFileError('Please upload only PDF or DOCX files');
        setDocumentFormat(null);
      }
    }
  };
  
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInputRef.current?.value) {
      setApiKey(apiKeyInputRef.current.value);
      setShowApiKeyModal(false);
      // If we're in the generate step, continue with generation
      if (currentStep === 3) {
        handleGenerate();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-transparent">
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Enter Gemini API Key</h3>
            <form onSubmit={handleApiKeySubmit}>
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  ref={apiKeyInputRef}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your Gemini API key"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored only in your browser and used only for this session.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress indicator - Mobile Friendly */}
      <div className="mb-6">
        {/* Desktop/Tablet View */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <div className="ml-2 text-sm font-medium">Enter Text</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{width: currentStep >= 2 ? '100%' : '0%'}}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <div className="ml-2 text-sm font-medium">Upload Document</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{width: currentStep >= 3 ? '100%' : '0%'}}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <div className="ml-2 text-sm font-medium">Generate</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{width: currentStep >= 4 ? '100%' : '0%'}}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              4
            </div>
            <div className="ml-2 text-sm font-medium">Download</div>
          </div>
        </div>
        
        {/* Mobile View - Vertical Steps */}
        <div className="md:hidden">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? <CheckCircle size={16} /> : '1'}
              </div>
              <div className={`ml-2 text-sm font-medium ${currentStep === 1 ? 'font-bold' : ''}`}>Enter Text</div>
            </div>
            <div className="w-1 h-6 ml-4 bg-gray-200">
              <div className={`h-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 2 ? <CheckCircle size={16} /> : '2'}
              </div>
              <div className={`ml-2 text-sm font-medium ${currentStep === 2 ? 'font-bold' : ''}`}>Upload Document</div>
            </div>
            <div className="w-1 h-6 ml-4 bg-gray-200">
              <div className={`h-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 3 ? <CheckCircle size={16} /> : '3'}
              </div>
              <div className={`ml-2 text-sm font-medium ${currentStep === 3 ? 'font-bold' : ''}`}>Generate</div>
            </div>
            <div className="w-1 h-6 ml-4 bg-gray-200">
              <div className={`h-full ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                4
              </div>
              <div className={`ml-2 text-sm font-medium ${currentStep === 4 ? 'font-bold' : ''}`}>Download</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Configuration Button */}
      <div className="absolute top-4 right-4">
        <button 
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none text-sm"
          onClick={() => setShowApiKeyModal(true)}
        >
          <Settings size={16} className="mr-2" />
          {apiKey ? 'Change API Key' : 'Set API Key'}
        </button>
      </div>

      {/* Step 1: Text Input */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Step 1: Enter Your Instructions</h2>
          <div className="relative">
            <textarea
              className="w-full h-48 md:h-64 p-4 border-2 border-dashed border-gray-500 rounded-lg focus:outline-none focus:border-indigo-400"
              placeholder="Enter instructions on how to modify the document or what kind of content to generate..."
              value={text}
              onChange={handleTextChange}
            ></textarea>
            <div className="text-right text-sm text-gray-500 mt-2">
              {charCount} / {maxChars} characters
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none disabled:bg-gray-300"
              onClick={nextStep}
              disabled={!text.trim()}
            >
              Next <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Step 2: Upload Document</h2>
          <div 
            className={`w-full h-48 md:h-64 p-4 bg-amber-50 border-2 border-dashed border-gray-500 ${fileError ? 'border-red-300' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-center">
                <FileText size={36} className="mx-auto mb-2 text-blue-500" />
                <p className="text-gray-700 text-sm md:text-base truncate max-w-full">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">File type: {file.type || `DOCX/PDF (${file.name.split('.').pop()})`}</p>
                <button 
                  className="mt-2 text-blue-500 underline text-sm" 
                  onClick={() => {
                    setFile(null);
                    setDocumentFormat(null);
                    setExtractedText('');
                  }}
                >
                  Choose another file
                </button>
              </div>
            ) : (
              <>
                <Upload size={36} className="text-gray-400 mb-2" />
                <p className="text-gray-500 mb-2 text-sm md:text-base text-center">Drag and drop your document or</p>
                <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full cursor-pointer hover:bg-blue-200 text-sm">
                  Browse files
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-4">Accepted formats: PDF, DOCX</p>
              </>
            )}
          </div>
          
          {fileError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle size={16} className="mr-1" />
              {fileError}
            </div>
          )}
          
          {extractedText && (
            <div className="bg-white p-3 rounded-lg border border-gray-200 mt-4">
              <h3 className="text-sm font-medium mb-2">Document Preview</h3>
              <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-sm">
                <p className="text-gray-700">{extractedText.substring(0, 300)}...</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none text-sm md:text-base"
              onClick={prevStep}
            >
              <ArrowLeft size={16} className="mr-1 md:mr-2" /> Back
            </button>
            <button
              className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 focus:outline-none text-sm md:text-base"
              onClick={nextStep}
              disabled={!file}
            >
              Next <ArrowRight size={16} className="ml-1 md:ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review and Generate */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Step 3: Review and Generate</h2>
          
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm md:text-md font-medium mb-2">Instructions</h3>
            <div className="max-h-24 md:max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-sm md:text-base">
              <p className="text-gray-700">
                {text ? (text.length > 150 ? text.substring(0, 150) + '...' : text) : 'No instructions provided'}
              </p>
            </div>
          </div>
          
          {file && (
            <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm md:text-md font-medium mb-2">Document</h3>
              <div className="p-2 bg-gray-50 rounded flex items-center">
                <FileText size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-gray-700 text-sm md:text-base truncate">{file.name}</p>
              </div>
            </div>
          )}
          
          {/* API Key Notice */}
          {!apiKey && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start">
              <AlertCircle size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-700">
                  You'll need to provide a Gemini API key to generate content.
                </p>
                <button 
                  className="text-blue-600 text-sm font-medium mt-1 underline"
                  onClick={() => setShowApiKeyModal(true)}
                >
                  Set API Key
                </button>
              </div>
            </div>
          )}
          
          {processError && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center">
              <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{processError}</p>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:justify-between space-y-2 md:space-y-0 mt-4">
            <button
              className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none text-sm md:text-base"
              onClick={prevStep}
              disabled={isGenerating}
            >
              <ArrowLeft size={16} className="mr-1 md:mr-2" /> Back
            </button>
            
            <button
              className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-purple-800 text-white rounded-full hover:bg-purple-900 focus:outline-none text-sm md:text-base disabled:bg-purple-300"
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim() || !file}
            >
              {isGenerating ? (
                <>
                  <span className="animate-pulse">Generating...</span>
                </>
              ) : (
                <>
                  Generate <ArrowRight size={16} className="ml-1 md:ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results and Download */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Step 4: Generated Content</h2>
          
          {generatedContent && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-medium mb-2">Preview</h3>
              <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 rounded text-sm">
                <p className="whitespace-pre-wrap text-gray-700">
                  {generatedContent.length > 800 
                    ? generatedContent.substring(0, 800) + '...' 
                    : generatedContent}
                </p>
              </div>
            </div>
          )}
          
          {generatedDocument && (
            <div className="flex flex-col items-center justify-center bg-blue-50 p-4 rounded-lg border border-blue-100">
              <CheckCircle size={28} className="text-green-500 mb-2" />
              <p className="text-blue-800 mb-3 text-center">
                Your {documentFormat === 'docx' ? 'DOCX' : 'PDF'} document is ready!
              </p>
              <button
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none"
                onClick={handleDownload}
              >
                Download <Download size={16} className="ml-2" />
              </button>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
              onClick={prevStep}
            >
              <ArrowLeft size={16} className="mr-2" /> Back
            </button>
            <button
              className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none"
              onClick={() => {
                // Reset and start over
                setCurrentStep(1);
                setText('');
                setFile(null);
                setCharCount(0);
                setFileError(null);
                setGeneratedContent(null);
                setIsGenerating(false);
                setDocumentFormat(null);
                setGeneratedDocument(null);
                setExtractedText('');
                setProcessError(null);
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}