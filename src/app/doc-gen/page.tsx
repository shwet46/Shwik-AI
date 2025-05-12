'use client';

import DocumentGenerator from "@/components/DocumentGenerator";

export default function DocGenPage() {

  return (
    <main className="min-h-screen antialiased flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <h3 className="text-xl sm:text-2xl lg:text-3xl text-center mt-8 sm:mt-12 text-indigo-950 mb-6 sm:mb-8">
        Add description or summary and upload the template.
      </h3>
      <DocumentGenerator />
    </main>
  );
}