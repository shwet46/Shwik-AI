import React from 'react';
import ClientWrapper from '@/components/ClientWrapper';

export default function Page() {
  return (
    <main className="min-h-screen antialiased flex flex-col items-center justify-center px-4 py-10">
      <h3 className="text-2xl text-center mt-12 text-indigo-950 mb-8">
        Add a document or text as an input and generate a summary of it
      </h3>
      <ClientWrapper />
    </main>
  );
}