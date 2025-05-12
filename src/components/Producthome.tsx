'use client';

import React from 'react';

function Producthome() {
  return (
    <div className="flex flex-col items-center justify-center mt-10 px-4 sm:px-6 mb-10 lg:px-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-violet-950 text-center">What we offer</h1>
      
      <div className="flex flex-col md:flex-row gap-10 mt-10 w-full max-w-6xl">
        <div className="w-full md:w-1/2 text-center md:text-left p-4 border border-gray-200 shadow-md bg-yellow-200 sticky top-0 transform transition duration-300 hover:scale-105 hover:animate-[wiggle_0.3s_ease-in-out]">
          <h1 className="text-2xl sm:text-3xl font-bold text-rose-900">Document Generation</h1>
          <p className="text-lg sm:text-xl mt-4">
            Generate documents by providing a summary or topic description, whether about an event or a project.
            Customize preferences and obtain the document you need. Use the default template or share a custom one.
          </p>
          <button className="mt-4 px-6 py-2 text-xl font-bold text-black bg-yellow-300 border-2 border-black shadow-md transform hover:scale-105 hover:rotate-1 transition duration-300 hand-drawn-border">
            Try Now
          </button>
        </div>
        
        <div className="w-full md:w-1/2 text-center md:text-left p-4 border border-gray-200 shadow-md bg-yellow-200 sticky top-0 transform transition duration-300 hover:scale-105 hover:animate-[wiggle_0.3s_ease-in-out]">
          <h1 className="text-2xl sm:text-3xl font-bold text-rose-900">Summarization</h1> 
          <p className="text-lg sm:text-xl mt-4">
            Summarize content effectively by inputting a description or topic. Filter preferences and get a concise summary.
            Use predefined templates or create your own for more customized results.
          </p>
          <button className="mt-4 px-6 py-2 text-xl font-bold text-black bg-yellow-300 border-2 border-black shadow-md transform hover:scale-105 hover:rotate-1 transition duration-300 hand-drawn-border">
            Try Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Producthome;
