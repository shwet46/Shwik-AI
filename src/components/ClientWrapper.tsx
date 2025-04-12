'use client';

import dynamic from 'next/dynamic';

const FileUpload = dynamic(
  () => import('@/components/FileUpload'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <FileUpload />;
}