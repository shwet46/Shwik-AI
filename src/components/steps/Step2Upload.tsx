import { FileText, Upload, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

interface Step2UploadProps {
  file: File | null;
  fileError: string | null;
  extractedText: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  setFile: (file: File | null) => void;
  setDocumentFormat: (format: string | null) => void;
  setExtractedText: (text: string) => void;
}

export default function Step2Upload({
  file, fileError, extractedText, onFileChange, onDrop, onDragOver, onPrev, onNext, setFile, setDocumentFormat, setExtractedText
}: Step2UploadProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Step 2: (Optional) Upload Document</h2>
      <div
        className={`w-full h-48 md:h-64 p-4 bg-amber-50 border-2 border-dashed border-gray-500 ${fileError ? 'border-red-300' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center`}
        onDragOver={onDragOver}
        onDrop={onDrop}
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
                onChange={onFileChange}
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
          onClick={onPrev}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>
        <button
          className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 focus:outline-none text-sm md:text-base"
          onClick={onNext}
        >
          Next <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}