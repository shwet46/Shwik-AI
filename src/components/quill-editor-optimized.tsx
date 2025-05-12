'use client';

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ initialContent, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
          ]
        }
      });
      quillRef.current.root.innerHTML = initialContent || '';
      quillRef.current.on('text-change', () => {
        onChange(quillRef.current!.root.innerHTML);
      });
    }
    // Update content if initialContent changes
    if (quillRef.current && initialContent !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = initialContent || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef, initialContent]);

  return (
    <div>
      <div ref={editorRef} style={{ minHeight: 300 }} />
    </div>
  );
};

export default QuillEditor;