'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Upload, ArrowRight, ArrowLeft, AlertCircle, Download, Edit } from 'lucide-react';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

// Import Quill dynamically to prevent SSR issues
const QuillEditor = dynamic(() => import('./quill-editor-optimized'), {
  ssr: false,
  loading: () => <p className="p-4 text-center text-gray-500">Loading editor...</p>
});

export default function DocumentEditor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentFormat, setDocumentFormat] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [processError, setProcessError] = useState<string | null>(null);
  const [editorData, setEditorData] = useState('');
  const maxChars = 25000;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const inputText = e.target.value;
    setText(inputText);
    setCharCount(inputText.length);
  };

  interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & {
      files: FileList | null;
    };
  }

  interface DocumentError {
    message: string;
  }

    const handleFileChange = async (e: FileChangeEvent): Promise<void> => {
      setFileError(null);
      setProcessError(null);

      if (e.target.files && e.target.files[0]) {
        const selectedFile: File = e.target.files[0];
        const fileType: string = selectedFile.type;
        const fileName: string = selectedFile.name;
        const fileExtension: string | undefined = fileName.split('.').pop()?.toLowerCase();

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
              const text: string = await extractTextFromDocx(selectedFile);
              setExtractedText(text);
            } catch (error: unknown) {
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

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const extractTextFromDocx = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          try {
            const arrayBuffer = event.target.result;
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

  interface PDFTextItem {
    str: string;
  }

  interface PDFTextContent {
    items: PDFTextItem[];
  }

  interface PDFPage {
    getTextContent(): Promise<PDFTextContent>;
  }

  interface PDFDocument {
    numPages: number;
    getPage(pageNum: number): Promise<PDFPage>;
  }

  interface PDFLoadingTask {
    promise: Promise<PDFDocument>;
  }

  interface PDFLib {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
    getDocument(data: Uint8Array): PDFLoadingTask;
  }

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        try {
          const pdfjsLib: PDFLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const loadingTask = pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item) => item.str).join(' ');
            fullText += textItems + ' ';
          }
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProcessError(null);

    try {
      let documentText = '';

      // Extract text from the uploaded document if present
      if (file) {
        try {
          if (documentFormat === 'docx') {
            documentText = await extractTextFromDocx(file);
          } else if (documentFormat === 'pdf') {
            documentText = await extractTextFromPdf(file);
          }
        } catch (error) {
          setProcessError('Failed to extract text from document. Please try another file.');
          setIsGenerating(false);
          return;
        }
      }

      // Use API to process the description and generate updated content
      const payload = {
        description: text + (documentText ? `\n\n${documentText}` : ''),
      };

      try {
        const response = await fetch('/api/generate-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to generate content');
        const result = await response.json();
        const generatedHtml = result.html || result.content || '';
        setEditorData(generatedHtml);
        setCurrentStep(4);
      } catch (error) {
        setProcessError('Failed to generate content. Please try again.');
      }
    } catch (error) {
      setProcessError(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsDocx = async () => {
    try {
      // For Quill, we need to get the HTML content from the editor
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorData;
      interface FormattedParagraph extends Paragraph {}
      const paragraphs: FormattedParagraph[] = [];
      
      // Process Quill HTML into docx paragraphs
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const nodeName = node.nodeName.toLowerCase();
          
          // Handle Quill-specific structure
          if (nodeName === 'p') {
            // Process paragraph contents with formatting
            const runs: TextRun[] = [];
            Array.from(node.childNodes).forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                runs.push(new TextRun(child.textContent || ''));
              } else if (child.nodeName.toLowerCase() === 'strong' || child.nodeName.toLowerCase() === 'b') {
                runs.push(new TextRun({ text: child.textContent || '', bold: true }));
              } else if (child.nodeName.toLowerCase() === 'em' || child.nodeName.toLowerCase() === 'i') {
                runs.push(new TextRun({ text: child.textContent || '', italics: true }));
              } else if (child.nodeName.toLowerCase() === 'u') {
                runs.push(new TextRun({ text: child.textContent || '', underline: { type: 'single' } }));
              } else if (child.nodeName.toLowerCase() === 's') {
                runs.push(new TextRun({ text: child.textContent ?? '', strike: true }));
              } else {
                // For other elements, just get the text content
                runs.push(new TextRun(child.textContent || ''));
              }
            });
            
            if (runs.length > 0) {
              paragraphs.push(new Paragraph({ children: runs }));
            } else {
              paragraphs.push(new Paragraph({}));
            }
            return '';
          } 
          // Handle headers
          else if (/^h[1-6]$/.test(nodeName)) {
            const level = parseInt(nodeName.charAt(1));
            const headingType = `Heading${level}` as "Heading1" | "Heading2" | "Heading3" | "Heading4" | "Heading5" | "Heading6";
            paragraphs.push(new Paragraph({ 
              heading: headingType,
              children: [new TextRun(node.textContent || '')]
            }));
            return '';
          } 
          // Handle list items
          else if (nodeName === 'li') {
            const parentNodeName = node.parentNode?.nodeName.toLowerCase();
            const isOrdered = parentNodeName === 'ol';
            
            paragraphs.push(new Paragraph({
              bullet: !isOrdered ? { level: 0 } : undefined,
              numbering: isOrdered ? {
                reference: 'default-numbering',
                level: 0
              } : undefined,
              children: [new TextRun(node.textContent || '')]
            }));
            return '';
          } 
          // Handle blockquotes
          else if (nodeName === 'blockquote') {
            paragraphs.push(new Paragraph({
              indent: { left: 720 }, // 0.5 inch indent
              children: [new TextRun(node.textContent || '')]
            }));
            return '';
          } 
          // Handle line breaks
          else if (nodeName === 'br') {
            return '\n';
          } 
          // Process other elements recursively
          else {
            return Array.from(node.childNodes)
              .map(child => processNode(child))
              .join('');
          }
        }
        return '';
      };
      
      // Start processing from the root
      const rootNode = tempDiv.querySelector('.ql-editor') || tempDiv;
      Array.from(rootNode.childNodes).forEach(node => processNode(node));
      
      // Create the document with processed paragraphs
      interface DocumentProperties extends Record<string, unknown> {}

      interface DocumentSection {
        properties: DocumentProperties;
        children: Paragraph[];
      }

      interface DocumentConfig {
        sections: DocumentSection[];
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun("Empty document")] })]
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      const fileName = file ? `edited_${file.name.replace(/\.[^/.]+$/, "")}.docx` : 'document.docx';
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error creating DOCX:", error);
      alert('Failed to generate DOCX file. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  interface DragEvent extends React.DragEvent<HTMLDivElement> {
    dataTransfer: DataTransfer;
  }

  interface FileProcessingResult {
    text: string;
    format: 'pdf' | 'docx';
  }

  const handleDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setFileError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile: File = e.dataTransfer.files[0];
      const fileType: string = droppedFile.type;
      const fileName: string = droppedFile.name;
      const fileExtension: string | undefined = fileName.split('.').pop()?.toLowerCase();

      if (
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'pdf' ||
        fileExtension === 'docx'
      ) {
        setFile(droppedFile);

        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
          setDocumentFormat('pdf');
        } else {
          setDocumentFormat('docx');
          try {
            const text: string = await extractTextFromDocx(droppedFile);
            setExtractedText(text);
          } catch (error) {
            setFileError('Could not extract text from document.');
          }
        }
      } else {
        setFileError('Please upload only PDF or DOCX files');
        setDocumentFormat(null);
      }
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setText('');
    setFile(null);
    setCharCount(0);
    setFileError(null);
    setIsGenerating(false);
    setDocumentFormat(null);
    setExtractedText('');
    setProcessError(null);
    setEditorData('');
  };

  // Update editor content handler for Quill
  interface EditorChangeHandler {
    (content: string): void;
  }

  const handleEditorChange: EditorChangeHandler = (content) => {
    setEditorData(content);
  };

  // Framer Motion variants for step transitions
  const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-transparent">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className="ml-2 text-sm font-medium">Enter Text</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <div className="ml-2 text-sm font-medium">Upload Document</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: currentStep >= 3 ? '100%' : '0%' }}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
            <div className="ml-2 text-sm font-medium">Generate</div>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: currentStep >= 4 ? '100%' : '0%' }}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>4</div>
            <div className="ml-2 text-sm font-medium">Edit & Download</div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium">Step 1: Enter Your Instructions</h2>
            <div className="relative">
              <textarea
                className="w-full h-48 md:h-64 p-4 border-2 border-dashed border-gray-500 rounded-lg focus:outline-none focus:border-indigo-400"
                placeholder="Enter instructions on how to modify the document or what kind of content to generate..."
                value={text}
                onChange={handleTextChange}
                maxLength={maxChars}
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
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium">Step 2: (Optional) Upload Document</h2>
            <div
              className={`w-full h-48 md:h-64 p-4 bg-amber-50 border-2 border-dashed border-gray-500 ${fileError ? 'border-red-300' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="text-center">
                  <FileText size={36} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-700 text-sm md:text-base truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    File type: {file.type || `DOCX/PDF (${file.name.split('.').pop()})`}
                  </p>
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
                  <p className="text-gray-500 mb-2 text-sm md:text-base text-center">
                    Drag and drop your document or
                  </p>
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
                <ArrowLeft size={16} className="mr-2" /> Back
              </button>
              <button
                className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 focus:outline-none text-sm md:text-base"
                onClick={nextStep}
              >
                Next <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium">Step 3: Review and Generate</h2>
            <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm md:text-md font-medium mb-2">Instructions</h3>
              <div className="max-h-24 md:max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-sm md:text-base">
                <p className="text-gray-700">
                  {text
                    ? text.length > 150
                      ? text.substring(0, 150) + '...'
                      : text
                    : 'No instructions provided'}
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
                <ArrowLeft size={16} className="mr-2" /> Back
              </button>
              <button
                className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-purple-800 text-white rounded-full hover:bg-purple-900 focus:outline-none text-sm md:text-base disabled:bg-purple-300"
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
              >
                {isGenerating ? (
                  <motion.span
                    className="flex items-center"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
                  >
                    <svg className="animate-spin mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Generating...
                  </motion.span>
                ) : (
                  <>
                    Generate <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium flex items-center">
              <Edit size={20} className="mr-2" />
              Step 4: Edit and Download
            </h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-2 rounded-lg border border-gray-200"
            >
              {editorData !== undefined ? (
                <>
                  <div className="mb-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p>Edit your document below. All changes are saved automatically.</p>
                  </div>
                  <div className="min-h-96 mb-4">
                    <QuillEditor
                      initialContent={editorData}
                      onChange={handleEditorChange}
                    />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={downloadAsDocx}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none"
                    >
                      <Download size={18} className="mr-2" />
                      Download as DOCX
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>Editor is loading or no content is generated yet...</p>
                </div>
              )}
            </motion.div>
            <div className="flex justify-between mt-6">
              <button
                className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
                onClick={prevStep}
              >
                <ArrowLeft size={16} className="mr-2" /> Back
              </button>
              <button
                className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none"
                onClick={resetForm}
              >
                Start Over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}