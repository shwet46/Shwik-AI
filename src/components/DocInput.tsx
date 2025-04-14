'use client';

import { useState } from 'react';
import { FileText, Upload, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function DocInput() {
  const [currentStep, setCurrentStep] = useState(1);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const maxChars = 25000;

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

  const handleFileChange = (e: FileChangeEvent): void => {
    setFileError(null);
    
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
      } else {
        setFileError('Please upload only PDF or DOCX files');
        setFile(null);
      }
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleGenerate = () => {
    // Generate logic would go here
    console.log('Generating with text:', text);
    console.log('Generating with file:', file);
    
    // Here you would implement your API call to process the document
    // Example:
    // const formData = new FormData();
    // formData.append('text', text);
    // if (file) formData.append('document', file);
    // fetch('/api/generate-summary', {
    //   method: 'POST',
    //   body: formData
    // }).then(response => response.json())
    //   .then(data => console.log(data));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
      } else {
        setFileError('Please upload only PDF or DOCX files');
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-transparent">
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
                3
              </div>
              <div className={`ml-2 text-sm font-medium ${currentStep === 3 ? 'font-bold' : ''}`}>Generate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Text Input */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Step 1: Enter Your Text</h2>
          <div className="relative">
            <textarea
              className="w-full h-48 md:h-64 p-4 border-2 border-dashed border-gray-500 rounded-lg focus:outline-none focus:border-indigo-400"
              placeholder="Paste in your notes or other content to summarize..."
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
          <h2 className="text-lg font-medium">Step 2: Upload Document (Optional)</h2>
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
                  onClick={() => setFile(null)}
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
            <h3 className="text-sm md:text-md font-medium mb-2">Text Input</h3>
            <div className="max-h-24 md:max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-sm md:text-base">
              <p className="text-gray-700">
                {text ? (text.length > 100 ? text.substring(0, 100) + '...' : text) : 'No text provided'}
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
          
          <div className="flex flex-col md:flex-row md:justify-between space-y-2 md:space-y-0 mt-4">
            <button
              className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none text-sm md:text-base"
              onClick={prevStep}
            >
              <ArrowLeft size={16} className="mr-1 md:mr-2" /> Back
            </button>
            
            <button
              className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-purple-800 text-white rounded-full hover:bg-purple-900 focus:outline-none text-sm md:text-base"
              onClick={handleGenerate}
            >
              <FileText size={16} className="mr-1 md:mr-2" />
              Generate Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}