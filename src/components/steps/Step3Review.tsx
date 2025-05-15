import { FileText, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step3ReviewProps {
  text: string;
  file: File | null;
  processError: string | null;
  isGenerating: boolean;
  onPrev: () => void;
  onGenerate: () => void;
}

export default function Step3Review({
  text, file, processError, isGenerating, onPrev, onGenerate
}: Step3ReviewProps) {
  return (
    <div className="space-y-4">
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
          onClick={onPrev}
          disabled={isGenerating}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>
        <button
          className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-purple-800 text-white rounded-full hover:bg-purple-900 focus:outline-none text-sm md:text-base disabled:bg-purple-300"
          onClick={onGenerate}
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
    </div>
  );
}