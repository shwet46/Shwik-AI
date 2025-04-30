// app/services/posterTemplates.ts

interface DesignConfig {
    layout?: string;
    colors?: string;
    typography?: string;
    dataVisualizations?: string[];
    imagery?: string;
    style?: string;
  }
  
  interface Section {
    heading: string;
    content: string;
  }
  
  interface AcademicPosterData {
    title: string;
    sections: Section[];
    design: DesignConfig;
    visualElements?: string[];
  }
  
  interface MarketingPosterData {
    headline: string;
    tagline: string;
    sellingPoints: string[];
    callToAction: string;
    design: DesignConfig;
  }
  
  interface InfographicPosterData {
    title: string;
    dataPoints: string[];
    sections: Section[];
    design: DesignConfig;
  }
  
  // Helper to select colors from predefined palettes
  function getColorPalette(designConfig: DesignConfig): string[] {
    // Default palette
    const defaultPalette = ['#2563EB', '#3B82F6', '#60A5FA', '#DBEAFE', '#FFFFFF'];
    
    const colorDesc = designConfig.colors?.toLowerCase() || '';
    
    if (colorDesc.includes('blue') || colorDesc.includes('cool')) {
      return ['#1E40AF', '#3B82F6', '#93C5FD', '#DBEAFE', '#FFFFFF'];
    } else if (colorDesc.includes('green') || colorDesc.includes('eco')) {
      return ['#166534', '#22C55E', '#86EFAC', '#DCFCE7', '#FFFFFF'];
    } else if (colorDesc.includes('red') || colorDesc.includes('warm')) {
      return ['#991B1B', '#EF4444', '#FCA5A5', '#FEE2E2', '#FFFFFF'];
    } else if (colorDesc.includes('purple') || colorDesc.includes('violet')) {
      return ['#6D28D9', '#8B5CF6', '#C4B5FD', '#EDE9FE', '#FFFFFF'];
    } else if (colorDesc.includes('orange') || colorDesc.includes('amber')) {
      return ['#B45309', '#F59E0B', '#FCD34D', '#FEF3C7', '#FFFFFF'];
    } else if (colorDesc.includes('gray') || colorDesc.includes('grey') || colorDesc.includes('professional')) {
      return ['#1F2937', '#4B5563', '#9CA3AF', '#E5E7EB', '#FFFFFF'];
    }
    
    return defaultPalette;
  }
  
  // Convert design description to CSS styles
  function getTypographyStyles(designConfig: DesignConfig): { titleFont: string, headingFont: string, bodyFont: string } {
    const typographyDesc = designConfig.typography?.toLowerCase() || '';
    
    if (typographyDesc.includes('serif') || typographyDesc.includes('traditional')) {
      return {
        titleFont: "'Merriweather', serif",
        headingFont: "'Merriweather', serif",
        bodyFont: "'Lora', serif"
      };
    } else if (typographyDesc.includes('modern') || typographyDesc.includes('clean')) {
      return {
        titleFont: "'Montserrat', sans-serif",
        headingFont: "'Montserrat', sans-serif", 
        bodyFont: "'Open Sans', sans-serif"
      };
    } else if (typographyDesc.includes('minimal')) {
      return {
        titleFont: "'Roboto', sans-serif",
        headingFont: "'Roboto', sans-serif",
        bodyFont: "'Roboto', sans-serif"
      };
    } else if (typographyDesc.includes('mix') || typographyDesc.includes('contrast')) {
      return {
        titleFont: "'Playfair Display', serif",
        headingFont: "'Playfair Display', serif",
        bodyFont: "'Source Sans Pro', sans-serif"
      };
    }
    
    // Default typography
    return {
      titleFont: "'Inter', sans-serif",
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif"
    };
  }
  
  export function generateAcademicPosterHTML(data: AcademicPosterData): string {
    const colorPalette = getColorPalette(data.design);
    const typography = getTypographyStyles(data.design);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;500;700&family=Lora:wght@400;600&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: ${typography.bodyFont};
            margin: 0;
            padding: 0;
            background-color: ${colorPalette[4]};
            color: #1A202C;
          }
          .poster-container {
            width: 790px;
            height: 1120px;
            margin: 10px auto;
            background-color: ${colorPalette[3]};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
          }
          .poster-header {
            background-color: ${colorPalette[0]};
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .poster-title {
            font-family: ${typography.titleFont};
            font-size: 42px;
            font-weight: 700;
            margin: 0;
          }
          .poster-content {
            padding: 30px;
            column-count: ${data.design.layout?.includes('three column') ? 3 : 
                           data.design.layout?.includes('single column') ? 1 : 2};
            column-gap: 30px;
          }
          .poster-section {
            break-inside: avoid;
            margin-bottom: 25px;
          }
          .section-heading {
            font-family: ${typography.headingFont};
            font-size: 24px;
            font-weight: 600;
            color: ${colorPalette[0]};
            border-bottom: 2px solid ${colorPalette[1]};
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .section-content {
            font-size: 18px;
            line-height: 1.5;
          }
          .poster-footer {
            position: absolute;
            bottom: 0;
            width: 100%;
            background-color: ${colorPalette[0]};
            color: white;
            padding: 15px 0;
            text-align: center;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          <div class="poster-header">
            <h1 class="poster-title">${data.title}</h1>
          </div>
          <div class="poster-content">
            ${data.sections.map(section => `
              <div class="poster-section">
                <h2 class="section-heading">${section.heading}</h2>
                <div class="section-content">
                  ${section.content}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="poster-footer">
            Created with AI Poster Generator - ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  export function generateMarketingPosterHTML(data: MarketingPosterData): string {
    const colorPalette = getColorPalette(data.design);
    const typography = getTypographyStyles(data.design);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.headline}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;500;700&family=Lora:wght@400;600&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: ${typography.bodyFont};
            margin: 0;
            padding: 0;
            background-color: ${colorPalette[4]};
            color: #1A202C;
          }
          .poster-container {
            width: 790px;
            height: 1120px;
            margin: 10px auto;
            background-color: ${colorPalette[3]};
            background-image: linear-gradient(to bottom, ${colorPalette[2]}33, ${colorPalette[3]});
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .poster-header {
            background-color: ${colorPalette[0]};
            color: white;
            padding: 50px 30px;
            text-align: center;
          }
          .poster-headline {
            font-family: ${typography.titleFont};
            font-size: 64px;
            font-weight: 700;
            margin: 0 0 20px 0;
            line-height: 1.1;
          }
          .poster-tagline {
            font-family: ${typography.headingFont};
            font-size: 28px;
            font-style: italic;
            opacity: 0.9;
          }
          .poster-content {
            padding: 50px 40px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .selling-points {
            margin: 30px 0;
          }
          .selling-point {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            font-size: 24px;
            line-height: 1.4;
          }
          .selling-point:before {
            content: "✓";
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 40px;
            background-color: ${colorPalette[1]};
            color: white;
            border-radius: 50%;
            margin-right: 20px;
            flex-shrink: 0;
            font-weight: bold;
          }
          .call-to-action {
            text-align: center;
            margin-top: 50px;
          }
          .cta-button {
            display: inline-block;
            background-color: ${colorPalette[0]};
            color: white;
            font-family: ${typography.headingFont};
            font-size: 32px;
            font-weight: bold;
            padding: 15px 40px;
            border-radius: 8px;
            text-decoration: none;
            text-transform: uppercase;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          .poster-footer {
            background-color: ${colorPalette[0]};
            color: white;
            padding: 15px 0;
            text-align: center;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          <div class="poster-header">
            <h1 class="poster-headline">${data.headline}</h1>
            <div class="poster-tagline">${data.tagline}</div>
          </div>
          <div class="poster-content">
            <div class="selling-points">
              ${data.sellingPoints.map(point => `
                <div class="selling-point">${point}</div>
              `).join('')}
            </div>
            <div class="call-to-action">
              <a href="#" class="cta-button">${data.callToAction}</a>
            </div>
          </div>
          <div class="poster-footer">
            Created with AI Poster Generator - ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  export function generateInfographicPosterHTML(data: InfographicPosterData): string {
    const colorPalette = getColorPalette(data.design);
    const typography = getTypographyStyles(data.design);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;500;700&family=Lora:wght@400;600&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: ${typography.bodyFont};
            margin: 0;
            padding: 0;
            background-color: ${colorPalette[4]};
            color: #1A202C;
          }
          .poster-container {
            width: 790px;
            height: 1120px;
            margin: 10px auto;
            background-color: ${colorPalette[4]};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .poster-header {
            background-color: ${colorPalette[0]};
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .poster-title {
            font-family: ${typography.titleFont};
            font-size: 48px;
            font-weight: 700;
            margin: 0;
          }
          .data-points-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            padding: 30px;
            background-color: ${colorPalette[3]};
          }
          .data-point {
            width: 45%;
            margin-bottom: 25px;
            padding: 15px;
            background-color: ${colorPalette[4]};
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-left: 5px solid ${colorPalette[1]};
          }
          .poster-content {
            padding: 30px;
          }
          .poster-section {
            margin-bottom: 30px;
            background-color: ${colorPalette[3]};
            padding: 20px;
            border-radius: 8px;
          }
          .section-heading {
            font-family: ${typography.headingFont};
            font-size: 24px;
            font-weight: 600;
            color: ${colorPalette[0]};
            margin-top: 0;
            margin-bottom: 15px;
          }
          .section-content {
            font-size: 18px;
            line-height: 1.5;
          }
          .poster-footer {
            position: absolute;
            bottom: 0;
            width: 100%;
            background-color: ${colorPalette[0]};
            color: white;
            padding: 15px 0;
            text-align: center;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          <div class="poster-header">
            <h1 class="poster-title">${data.title}</h1>
          </div>
          <div class="data-points-container">
            ${data.dataPoints.map(point => `
              <div class="data-point">${point}</div>
            `).join('')}
          </div>
          <div class="poster-content">
            ${data.sections.map(section => `
              <div class="poster-section">
                <h2 class="section-heading">${section.heading}</h2>
                <div class="section-content">
                  ${section.content}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="poster-footer">
            Created with AI Poster Generator - ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  // Utility function to determine poster type and generate appropriate HTML
  export function generatePosterHTML(jsonData: any): string {
    try {
      // Determine the poster type based on the JSON structure
      if (jsonData.sections && jsonData.visualElements) {
        return generateAcademicPosterHTML(jsonData as AcademicPosterData);
      } else if (jsonData.headline && jsonData.tagline && jsonData.callToAction) {
        return generateMarketingPosterHTML(jsonData as MarketingPosterData);
      } else if (jsonData.dataPoints) {
        return generateInfographicPosterHTML(jsonData as InfographicPosterData);
      } else {
        // Fallback to infographic if structure is unclear
        const fallbackData: InfographicPosterData = {
          title: jsonData.title || "Generated Poster",
          dataPoints: jsonData.dataPoints || ["Key information extracted from your content"],
          sections: jsonData.sections || [{ 
            heading: "Summary", 
            content: "Content generated based on your input" 
          }],
          design: jsonData.design || { colors: "blue" }
        };
        return generateInfographicPosterHTML(fallbackData);
      }
    } catch (error) {
      console.error("Error generating poster HTML:", error);
      // Return a simple fallback template
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Generated Poster</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .poster-container { max-width: 800px; margin: 0 auto; }
            h1 { color: #2563EB; }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <h1>Generated Poster</h1>
            <p>There was an issue generating your poster with the specified format.</p>
            <div>${JSON.stringify(jsonData, null, 2)}</div>
          </div>
        </body>
        </html>
      `;
    }
  }