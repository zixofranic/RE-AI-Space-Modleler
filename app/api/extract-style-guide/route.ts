import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Phase 2 of "Seed & Lock" Workflow
 * Extracts specific material attributes from a staged image
 * to create a Project Style Guide for consistency across rooms
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageId } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Style Guide Extractor] Analyzing staged image: ${imageId || 'unknown'}`);

    // Use gemini-2.0-flash-exp for fast, accurate analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Phase 2 Prompt: Extract specific materials from staged image
    const prompt = `You are a professional interior design material analyst.

TASK: Analyze this staged room image and extract the SPECIFIC materials, finishes, and elements used.

Output ONLY valid JSON in this exact format (no markdown, no backticks):

{
  "primaryWood": "Specific wood type and finish (e.g., 'Light natural oak', 'Dark walnut with matte finish')",
  "secondaryWood": "Optional secondary wood if visible",
  "primaryMetal": "Main metal finish (e.g., 'Matte black', 'Brushed nickel', 'Polished brass')",
  "accentMetal": "Optional accent metal if visible",
  "primaryFabric": "Main upholstery/textile (e.g., 'Light gray linen', 'Charcoal velvet')",
  "accentFabric": "Optional accent fabric (e.g., 'White bouclé', 'Navy blue cotton')",
  "rugPattern": "Rug style if visible (e.g., 'Geometric black/white', 'Solid cream', 'Jute natural')",
  "greeneryType": "Plant types if visible (e.g., 'Monstera in white pot', 'Small succulents')"
}

RULES:
- Be SPECIFIC: Not "wood" but "Light oak with natural finish"
- Be CONCRETE: Not "neutral" but "Beige linen"
- If an element is not visible, use null
- Focus on the PRIMARY materials that define the room's look
- This guide will be used to maintain consistency across other rooms

Analyze the image and respond with ONLY the JSON:`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    console.log(`📋 [Style Guide Extractor] Raw response:\n${text}`);

    // Parse JSON response
    let styleGuide;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      styleGuide = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ [Style Guide Extractor] Failed to parse JSON:', text);
      throw new Error('Failed to parse style guide JSON from AI response');
    }

    // Add metadata
    styleGuide.extractedFrom = imageId || 'unknown';
    styleGuide.timestamp = new Date().toISOString();

    console.log(`✅ [Style Guide Extractor] Extracted style guide:`, styleGuide);

    return NextResponse.json({
      success: true,
      styleGuide,
    });

  } catch (error) {
    console.error('❌ [Style Guide Extractor] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Style guide extraction failed',
      },
      { status: 500 }
    );
  }
}
