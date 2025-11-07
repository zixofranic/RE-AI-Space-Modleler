const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert data URL to base64
function dataUrlToBase64(dataUrl) {
    return dataUrl.split(',')[1];
}

// Helper function to get image mime type from data URL
function getMimeType(dataUrl) {
    const match = dataUrl.match(/data:([^;]+);/);
    return match ? match[1] : 'image/jpeg';
}

// Generate design context from preferences
function generateDesignContext(preferences) {
    return `
You are an expert interior designer specializing in real estate staging. Based on the following client preferences, create a cohesive, attractive design for staging empty rooms.

DESIGN PREFERENCES:
- Property Type: ${preferences.propertyType}
- Target Buyer: ${preferences.targetBuyer}
- Design Style: ${preferences.designStyle}
- Color Palette: ${preferences.colorPalette}
- Wood Finish: ${preferences.woodFinish}
- Metal Accents: ${preferences.metalAccents}
- Furniture Style: ${preferences.furnitureStyle}
- Atmosphere: ${preferences.atmosphere}
- Lighting: ${preferences.lighting}
- Wall Decor: ${preferences.wallDecor}
- Flooring: ${preferences.flooring}
- Rug Style: ${preferences.rugStyle}
- Window Treatments: ${preferences.windowTreatments}
- Greenery: ${preferences.greenery}
- Texture: ${preferences.texture}
- Seating: ${preferences.seating}
- Storage: ${preferences.storage}
- Accents: ${preferences.accents}
- Price Point: ${preferences.pricePoint}
- Consistency: ${preferences.consistency}

CRITICAL REQUIREMENTS:
1. ALL rooms must follow the EXACT same design style and color palette
2. Use consistent furniture styles across all rooms
3. Maintain the same wood finishes and metal accents throughout
4. Create a cohesive flow between spaces
5. Ensure designs appeal to the target buyer demographic
6. Make the space feel luxurious, inviting, and move-in ready
7. Follow current real estate staging best practices
`;
}

// API endpoint for generating staging
app.post('/api/generate-staging', async (req, res) => {
    try {
        const { preferences, images } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured. Please add it to your .env file');
        }

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        console.log(`Processing ${images.length} images with Gemini AI...`);

        const designContext = generateDesignContext(preferences);
        const analysisModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const imageGenModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

        const results = [];

        // Process each image
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            console.log(`Analyzing image ${i + 1}/${images.length}: ${image.name}`);

            try {
                // Prepare the image for Gemini
                const imageBase64 = dataUrlToBase64(image.data);
                const mimeType = getMimeType(image.data);

                // Create consistency context if not first image
                let consistencyNote = '';
                if (i > 0) {
                    consistencyNote = `\n\nIMPORTANT: This is image ${i + 1} of ${images.length}. Maintain EXACT consistency with previous rooms:
- Use the same design style: ${preferences.designStyle}
- Use the same color palette: ${preferences.colorPalette}
- Use the same furniture style
- Maintain visual continuity
Previous room designs: ${JSON.stringify(results.slice(0, 2).map(r => r.brief))}`;
                }

                const prompt = `${designContext}${consistencyNote}

Analyze this empty room image and provide detailed virtual staging recommendations.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just valid JSON):
{
    "roomType": "name of room (e.g., Living Room, Master Bedroom, Kitchen)",
    "currentFeatures": "describe existing features (windows, flooring, lighting, dimensions, architectural details)",
    "furnitureLayout": "detailed furniture placement and layout description",
    "furniturePieces": ["specific piece 1", "specific piece 2", "..."],
    "colorScheme": "exact colors to use (must match: ${preferences.colorPalette})",
    "decorElements": ["specific decor item 1", "specific decor item 2", "..."],
    "lightingPlan": "specific lighting fixtures and placement",
    "textiles": "rugs, curtains, pillows, throws - specific descriptions",
    "artAndWallDecor": "specific wall art and decor recommendations",
    "plants": "specific plant recommendations if applicable",
    "styleConsistency": "how this room connects to other rooms in the ${preferences.designStyle} style",
    "description": "compelling 2-3 sentence description of the staged room",
    "suggestions": "detailed list of all furniture and decor with specific style details",
    "brief": "one sentence summary for consistency across rooms"
}`;

                const result = await analysisModel.generateContent([
                    prompt,
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    }
                ]);

                const response = await result.response;
                let text = response.text();

                // Clean up the response to extract JSON
                text = text.trim();

                // Remove markdown code blocks if present
                if (text.startsWith('```json')) {
                    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                } else if (text.startsWith('```')) {
                    text = text.replace(/```\n?/g, '');
                }

                // Parse the JSON response
                let analysisResult;
                try {
                    analysisResult = JSON.parse(text);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Response text:', text);

                    // Fallback response
                    analysisResult = {
                        roomType: `Room ${i + 1}`,
                        description: `A beautifully staged ${preferences.designStyle} room with ${preferences.colorPalette} tones.`,
                        suggestions: `This room features carefully selected furniture in ${preferences.furnitureStyle} style, complemented by ${preferences.atmosphere} atmosphere.`,
                        brief: `${preferences.designStyle} styled room ${i + 1}`
                    };
                }

                // Generate staged image using Gemini 2.5 Flash Image with EDITING approach
                console.log(`Generating staged image for ${analysisResult.roomType}...`);

                // Image editing prompt that preserves the original room
                const imagePrompt = `Using the provided room image, add the following furniture and decor while keeping the walls, floor, windows, ceiling, and lighting EXACTLY the same:

Furniture to Add: ${analysisResult.furniturePieces?.join(', ')}
Layout: ${analysisResult.furnitureLayout}
Color Scheme: ${analysisResult.colorScheme} (ensure furniture matches these colors)
Decor Elements: ${analysisResult.decorElements?.join(', ')}
Textiles: ${analysisResult.textiles}
Wall Art: ${analysisResult.artAndWallDecor}
${analysisResult.plants ? `Plants: ${analysisResult.plants}` : ''}

CRITICAL REQUIREMENTS:
- Keep the existing room architecture, walls, floor, and windows UNCHANGED
- Preserve the original lighting and shadows
- Add furniture that fits naturally in the space with correct proportions
- Ensure new furniture casts appropriate shadows matching the room's lighting
- Make it look like a professional real estate listing photo - photorealistic and move-in ready
- Style: ${preferences.designStyle}
- The result should look like the SAME room, just furnished`;

                let stagedImageUrl = image.data; // Default to original

                try {
                    // Pass BOTH the original image AND the editing prompt
                    const imageGenResult = await imageGenModel.generateContent([
                        imagePrompt,
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64
                            }
                        }
                    ]);
                    const imageResponse = await imageGenResult.response;

                    // Extract the generated image from response
                    const generatedImage = imageResponse.candidates?.[0]?.content?.parts?.find(
                        part => part.inlineData
                    );

                    if (generatedImage?.inlineData) {
                        stagedImageUrl = `data:${generatedImage.inlineData.mimeType};base64,${generatedImage.inlineData.data}`;
                        console.log(`✓ Generated staged image for ${analysisResult.roomType}`);
                    } else {
                        console.log(`⚠ Could not generate image, using original`);
                    }
                } catch (genError) {
                    console.error(`Error generating image for ${analysisResult.roomType}:`, genError.message);
                    console.log(`⚠ Using original image instead`);
                }

                results.push({
                    roomType: analysisResult.roomType,
                    description: analysisResult.description,
                    suggestions: analysisResult.suggestions ||
                        `Furniture: ${analysisResult.furniturePieces?.join(', ') || 'Contemporary pieces'}\n` +
                        `Decor: ${analysisResult.decorElements?.join(', ') || 'Tasteful accessories'}\n` +
                        `Colors: ${analysisResult.colorScheme}\n` +
                        `Textiles: ${analysisResult.textiles}`,
                    imageUrl: stagedImageUrl,
                    details: analysisResult,
                    brief: analysisResult.brief
                });

                console.log(`✓ Completed processing for ${analysisResult.roomType}`);

            } catch (imageError) {
                console.error(`Error processing image ${i + 1}:`, imageError);
                results.push({
                    roomType: `Room ${i + 1}`,
                    description: 'Error analyzing this image. Please try again.',
                    suggestions: imageError.message,
                    imageUrl: image.data,
                    error: true
                });
            }

            // Add a small delay to avoid rate limiting
            if (i < images.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('All images processed successfully');
        res.json(results);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: error.message,
            details: 'Please check your Gemini API key and try again'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🏠 Virtual Staging Server Running`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`\n💡 Make sure to set GEMINI_API_KEY in your .env file\n`);
});
