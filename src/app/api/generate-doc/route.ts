// /api/generate-doc/route.ts
import { NextRequest, NextResponse } from 'next/server';

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function POST(req: NextRequest) {
  if (!HF_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing API key' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const description = body?.description;

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const prompt = `<s>[INST] You are a document generation assistant.
Create a well-formatted document based on these instructions:

${description}

Generate the document as clean HTML content with appropriate tags (h1, h2, p, ul, ol, etc.).
Only provide the HTML content in your response, nothing else. [/INST]</s>`;

    let response;
    try {
      response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false
          }
        }),
        cache: 'no-store'
      });
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: 'Network error contacting AI provider', status: 'error' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errorData = await response.text();
      if (errorData.includes('Model is loading')) {
        return NextResponse.json(
          {
            error: 'Model is warming up, please try again in a few seconds',
            retry: true,
            status: 'error'
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          error: 'AI provider error',
          details: errorData,
          status: 'error'
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    let generatedContent = '';

    // Hugging Face returns an array with generated_text
    if (Array.isArray(result) && result.length > 0) {
      generatedContent = result[0]?.generated_text || '';
    } else if (typeof result === 'object' && result.generated_text) {
      generatedContent = result.generated_text;
    }

    // Remove the prompt from the generated text if present
    if (generatedContent.includes('[/INST]</s>')) {
      generatedContent = generatedContent.split('[/INST]</s>').pop() || generatedContent;
    } else if (generatedContent.includes('[/INST]')) {
      generatedContent = generatedContent.split('[/INST]').pop() || generatedContent;
    }

    if (!generatedContent || generatedContent.trim() === '') {
      return NextResponse.json(
        { error: 'Generated content is empty', status: 'error' },
        { status: 500 }
      );
    }

    const htmlContent = extractHtmlContent(generatedContent);

    return NextResponse.json({
      html: htmlContent,
      status: 'success'
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Server error processing request',
        message: error?.message || 'Failed to generate document content',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

// Extracts HTML content from the AI response, or wraps in <div> if not found
function extractHtmlContent(text: string): string {
  const trimmed = text.trim();
  // Try to find any HTML tag block
  const htmlMatch = trimmed.match(/<(html|body|div|h1|h2|h3|h4|h5|h6|p|ul|ol|li)[^>]*>[\s\S]*<\/\1>/i);
  if (htmlMatch) {
    return htmlMatch[0];
  }
  // Remove markdown code blocks and wrap in div
  const cleanText = trimmed
    .replace(/```html/g, '')
    .replace(/```/g, '')
    .replace(/^\s*<\/?[a-z]+>\s*$/gm, '');
  return `<div>${cleanText}</div>`;
}

export async function GET() {
  if (!HF_API_KEY) {
    return NextResponse.json(
      { status: 'error', message: 'API key not configured' },
      { status: 500 }
    );
  }
  return NextResponse.json(
    {
      status: 'online',
      message: 'Document generation API is running. Send a POST request with a description to generate content.'
    },
    { status: 200 }
  );
}