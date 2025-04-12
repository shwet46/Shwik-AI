import React from 'react'
import Image from 'next/image'

function Hero() {
  return (
    <div className="h-auto w-full rounded-md relative overflow-hidden mx-auto py-10 mt-18 px-4 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
        <div className="order-2 md:order-1 flex justify-center md:justify-start">
          <Image src="/images/heroimg.png" alt="Hero image" width={400} height={400} className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto mx-auto" />
        </div>
        
        <div className="order-1 md:order-2 flex flex-col text-center md:text-left">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-pink-600 mb-6">Shwik</h2>
          <h3 className="text-lg md:text-xl font-bold text-indigo-950">
            Shwik is a professional helper that let&apos;s you solve problems related
            to your everyday problems related to documents. May it be creating a document, 
            having a document summarized and many more issues we face.
          </h3>
        </div>
      </div>
    </div>
  );
}

export default Hero