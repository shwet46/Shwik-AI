# 📝 Shwik: Professional Document Helper

Shwik is a professional document assistant that leverages AI to help you solve your document issues with ease. It offers two main features: **Document Generation** and **Document Summarizer**. With a modern UI and support for DOCX/PDF, Shwik streamlines your workflow for creating, editing, and summarizing documents.

---

## Features

### 1. Document Generation
- **AI-powered document creation:** Enter instructions and optionally upload a DOCX or PDF template. Shwik-AI generates a new document based on your needs.
- **Rich text editing:** Edit the generated content in a Quill-based editor.
- **Download as DOCX:** Export your edited document in DOCX format.

### 2. Document Summarizer
- **Summarize documents:** Upload a DOCX, PDF, or paste text to get an instant AI-generated summary.
- **Multiple formats supported:** Works with DOCX, PDF, and plain text.

---

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/shwet46/Shwik-AI.git
   cd Shwik-AI
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Copy the example environment file:
     ```sh
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your API keys.  
     Example:
     ```env
     NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key"
     HUGGINGFACE_API_KEY="your_huggingface_api_key"
     ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```

5. **Open in your browser:**
   ```
   http://localhost:3000
   ```

---

## Tech Stack

- **Next.js** (React)
- **TypeScript**
- **Tailwind CSS**
- **docx** (DOCX generation)
- **mammoth** (DOCX parsing)
- **pdfjs-dist** (PDF parsing)
- **file-saver** (downloads)
- **Quill** (rich text editing)
- **AI Integration:** Hugging Face Inference API, Gemini API

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by Shweta

---