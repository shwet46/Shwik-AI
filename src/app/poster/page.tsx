'use client';

export default function DocGenPage() {
  const handleDocumentComplete = (content: string, document: Blob) => {
    // Handle the processed document here
    console.log('Document processed:', { content, document });
  };

  return (
    <main className="min-h-screen antialiased flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <h3 className="text-xl sm:text-2xl lg:text-3xl text-center mt-8 sm:mt-12 text-indigo-950 mb-6 sm:mb-8">
        Under progress....
      </h3>
    </main>
  );
}