import { Edit, Download, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('../quill-editor-optimized'), {
  ssr: false,
  loading: () => <p className="p-4 text-center text-gray-500">Loading editor...</p>
});

interface Step4EditDownloadProps {
  editorData: string;
  onEditorChange: (content: string) => void;
  onDownload: () => void;
  onPrev: () => void;
  onReset: () => void;
}

export default function Step4EditDownload({
  editorData, onEditorChange, onDownload, onPrev, onReset
}: Step4EditDownloadProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium flex items-center">
        <Edit size={20} className="mr-2" />
        Step 4: Edit and Download
      </h2>
      <div className="bg-white p-2 rounded-lg border border-gray-200">
        {editorData !== undefined ? (
          <>
            <div className="mb-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p>Edit your document below. All changes are saved automatically.</p>
            </div>
            <div className="min-h-96 mb-4">
              <QuillEditor
                initialContent={editorData}
                onChange={onEditorChange}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={onDownload}
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
      </div>
      <div className="flex justify-between mt-6">
        <button
          className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
          onClick={onPrev}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
        <button
          className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none"
          onClick={onReset}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}