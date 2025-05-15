import { ArrowRight } from 'lucide-react';

interface Step1InstructionsProps {
  text: string;
  charCount: number;
  maxChars: number;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNext: () => void;
}

export default function Step1Instructions({ text, charCount, maxChars, onTextChange, onNext }: Step1InstructionsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Step 1: Enter Your Instructions</h2>
      <div className="relative">
        <textarea
          className="w-full h-48 md:h-64 p-4 bg-amber-50 border-2 border-dashed border-gray-500 rounded-lg focus:outline-none focus:border-indigo-400"
          placeholder="Enter instructions on how to modify the document or what kind of content to generate..."
          value={text}
          onChange={onTextChange}
          maxLength={maxChars}
        ></textarea>
        <div className="text-right text-sm text-gray-500 mt-2">
          {charCount} / {maxChars} characters
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="flex items-center px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none disabled:bg-gray-300"
          onClick={onNext}
          disabled={!text.trim()}
        >
          Next <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}