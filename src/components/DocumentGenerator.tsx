'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Upload, ArrowRight, ArrowLeft, AlertCircle, Download, Edit } from 'lucide-react';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import {PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

import Step1Instructions from './steps/Step1Instructions';
import Step2Upload from './steps/Step2Upload';
import Step3Review from './steps/Step3Review';
import Step4EditDownload from './steps/Step4EditDownload';


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


  const handleFileChange = async (e: FileChangeEvent): Promise<void> => {
    setFileError(null);
    setProcessError(null);

    if (e.target.files && e.target.files[0]) {
      const selectedFile: File = e.target.files[0];
      const fileType: string = selectedFile.type;
      const fileName: string = selectedFile.name;
      const fileExtension: string | undefined = fileName.split('.').pop()?.toLowerCase();

    
      if (
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'pdf' ||
        fileExtension === 'docx'
      ) {
        setFile(selectedFile);

        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
          setDocumentFormat('pdf');
        } else {
          setDocumentFormat('docx');
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
  interface PDFLib {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
    getDocument(data: Uint8Array): {
      promise: Promise<PDFDocumentProxy>;
    };
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
            const textItems = textContent.items.map((item) => 'str' in item ? item.str : '').join(' ');
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
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorData;
      interface FormattedParagraph extends Paragraph {}
      const paragraphs: FormattedParagraph[] = [];
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const nodeName = node.nodeName.toLowerCase();
          if (nodeName === 'p') {
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
          else if (nodeName === 'blockquote') {
            paragraphs.push(new Paragraph({
              indent: { left: 720 }, 
              children: [new TextRun(node.textContent || '')]
            }));
            return '';
          } 
          else if (nodeName === 'br') {
            return '\n';
          } 
          else {
            return Array.from(node.childNodes)
              .map(child => processNode(child))
              .join('');
          }
        }
        return '';
      };
      const rootNode = tempDiv.querySelector('.ql-editor') || tempDiv;
      Array.from(rootNode.childNodes).forEach(node => processNode(node));
      interface DocumentProperties extends Record<string, unknown> {}

      interface DocumentSection {
        properties: DocumentProperties;
        children: Paragraph[];
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
  interface EditorChangeHandler {
    (content: string): void;
  }

  const handleEditorChange: EditorChangeHandler = (content) => {
    setEditorData(content);
  };
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
          <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Step1Instructions
              text={text}
              charCount={charCount}
              maxChars={maxChars}
              onTextChange={handleTextChange}
              onNext={nextStep}
            />
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Step2Upload
              file={file}
              fileError={fileError}
              extractedText={extractedText}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onPrev={prevStep}
              onNext={nextStep}
              setFile={setFile}
              setDocumentFormat={setDocumentFormat}
              setExtractedText={setExtractedText}
            />
          </motion.div>
        )}
        {currentStep === 3 && (
          <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Step3Review
              text={text}
              file={file}
              processError={processError}
              isGenerating={isGenerating}
              onPrev={prevStep}
              onGenerate={handleGenerate}
            />
          </motion.div>
        )}
        {currentStep === 4 && (
          <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Step4EditDownload
              editorData={editorData}
              onEditorChange={handleEditorChange}
              onDownload={downloadAsDocx}
              onPrev={prevStep}
              onReset={resetForm}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}