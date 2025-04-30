// app/services/geminiService.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Define poster generation modes
export type PosterMode = 'academic' | 'marketing' | 'infographic';

interface GeminiServiceConfig {
  apiKey: string;
  modelName?: string;
}

export interface PosterGenerationParams {
  content: string;
  title?: string;
  mode: PosterMode;
  maxContentLength?: number;
}

export class GeminiService {
  private apiKey: string;
  private modelName: string;
  
  constructor(config: GeminiServiceConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'gemini-1.5-pro';
  }
  
  async generatePosterContent(params: PosterGenerationParams): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      const maxLength = params.maxContentLength || 5000;
      const truncatedContent = params.content.substring(0, maxLength);
      const prompt = this.buildPrompt(truncatedContent, params.title, params.mode);
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error generating content with Gemini:", error);
      throw new Error(`Failed to generate poster content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private buildPrompt(content: string, title: string | undefined, mode: PosterMode): string {
    switch (mode) {
      case 'academic':
        return `Create a professional academic poster based on the following content:
        ${content}
        
        Generate the following in JSON format:
        1. A title (based on the content or use the provided title "${title || "Academic Poster"}")
        2. A structured outline with main sections, key points, and findings
        3. Design suggestions including layout structure, color scheme, and typography
        4. Any visual elements that would enhance the poster (charts, diagrams, etc.)
        
        Format the response as valid JSON with the following structure:
        {
          "title": "The poster title",
          "sections": [
            {"heading": "Section Title", "content": "Key points..."}
          ],
          "design": {
            "layout": "Layout description",
            "colors": "Color scheme",
            "typography": "Font suggestions"
          },
          "visualElements": ["Description of visual element 1", "Description of visual element 2"]
        }`;
      
      case 'marketing':
        return `Create a marketing poster based on the following content:
        ${content}
        
        Generate the following in JSON format:
        1. A catchy headline (based on the content or use the provided title "${title || "Marketing Poster"}")
        2. A compelling tagline
        3. Key selling points or benefits (3-5 points)
        4. A call to action
        5. Design suggestions including color scheme, imagery, and overall style
        
        Format the response as valid JSON with the following structure:
        {
          "headline": "The poster headline",
          "tagline": "A catchy tagline",
          "sellingPoints": ["Point 1", "Point 2", "Point 3"],
          "callToAction": "The call to action text",
          "design": {
            "colors": "Color scheme",
            "imagery": "Imagery suggestions",
            "style": "Overall style description"
          }
        }`;
      
      case 'infographic':
        return `Create an informative infographic based on the following content:
        ${content}
        
        Generate the following in JSON format:
        1. A clear title (based on the content or use the provided title "${title || "Infographic"}")
        2. A short introduction or overview
        3. Key data points or statistics (4-6 points)
        4. The logical flow of information
        5. Visual representations (charts, icons, diagrams)
        6. Design suggestions including color palette, layout, and visual hierarchy
        
        Format the response as valid JSON with the following structure:
        {
          "title": "The infographic title",
          "introduction": "Brief overview of the topic",
          "dataPoints": [
            {"label": "Data point label", "value": "Data value", "visualType": "Suggested visualization"}
          ],
          "informationFlow": ["Step 1", "Step 2", "Step 3"],
          "visualElements": ["Description of visual element 1", "Description of visual element 2"],
          "design": {
            "colorPalette": "Suggested color palette",
            "layout": "Layout suggestion",
            "visualHierarchy": "Visual hierarchy description"
          }
        }`;
      
      default:
        throw new Error(`Unsupported poster mode: ${mode}`);
    }
  }

  // Additional utility method to validate the generated JSON
  async validateAndFormatPosterContent(jsonContent: string): Promise<object> {
    try {
      const parsed = JSON.parse(jsonContent);
      return parsed;
    } catch (error) {
      console.error("Error parsing generated JSON content:", error);
      throw new Error("Generated content is not valid JSON. Please try again.");
    }
  }
}

// Example usage:
/*
const geminiService = new GeminiService({ apiKey: 'YOUR_API_KEY' });
const posterContent = await geminiService.generatePosterContent({
  content: "Your content here...",
  title: "Optional title",
  mode: "academic"
});

const formattedContent = await geminiService.validateAndFormatPosterContent(posterContent);
console.log(formattedContent);
*/