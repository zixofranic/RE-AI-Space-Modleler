import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RoomStagingConfig, RoomAnalysis, DesignSettings, ProjectStyleGuide } from '@/types';
import sharp from 'sharp';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GenerateRequest {
  imageId: string;
  imageDataUrl: string;
  config: RoomStagingConfig;
  analysis?: RoomAnalysis; // Optional - now done inline during mask generation
  projectId?: string; // Project ID for database save
  globalSettings?: Partial<DesignSettings>;
  projectStyleGuide?: ProjectStyleGuide; // "Seed & Lock" style guide
  enableSpatialConsistency?: boolean; // Experimental spatial consistency toggle
  referenceImageUrl?: string; // 🧪 VISUAL REFERENCE: Staged Image 1 URL for multi-image consistency
  manualRoomType?: string; // Optional manual room type override
}

/**
 * Analyze image and generate floor mask in a single call
 * Returns both basic room info and the mask for efficiency
 */
async function analyzeAndGenerateMask(imageBase64: string, mimeType: string, imageId: string, projectId?: string): Promise<{ mask: string; roomType: string; doors: number; windows: number }> {
  try {
    console.log('🎭 COMBINED ANALYSIS + MASK - Starting...');
    console.log(`📊 Input: imageId=${imageId}, mimeType=${mimeType}, base64Length=${imageBase64.length}`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    // Combined prompt: detect room type + count doors/windows + generate mask
    const maskPrompt = `Analyze this room and create a binary floor mask.

STEP 1 - ANALYSIS:
Tell me:
- Room type (e.g., "Living Room", "Bedroom", "Kitchen")
- Number of doors visible
- Number of windows visible

Format: ROOM:[type] DOORS:[number] WINDOWS:[number]

STEP 2 - CREATE MASK:
1. Fill ENTIRE image with solid black (#000000)
2. Paint ONLY floor area solid white (#FFFFFF)

RESULT MUST BE:
- Floor = Pure white
- Everything else = Pure black
- NO original photo details

CRITICAL: Output must look completely different from input. DO NOT return the original photo.`;

    console.log('🎭 COMBINED - Sending request to gemini-2.5-flash-image...');
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: maskPrompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      }],
    });

    const response = await result.response;
    const candidates = response.candidates;

    console.log(`🎭 COMBINED - Response received, candidates=${candidates?.length || 0}`);

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;

      // Extract text response for analysis
      const textPart = parts.find((part: any) => part.text);
      const imagePart = parts.find((part: any) => part.inlineData);

      console.log(`🎭 COMBINED - Found ${parts.length} parts, textPart=${!!textPart}, imagePart=${!!imagePart}`);

      // Parse room info from text
      let roomType = 'Room';
      let doors = 0;
      let windows = 0;

      if (textPart && textPart.text) {
        const text = textPart.text;
        console.log('📝 Response text:', text);

        const roomMatch = text.match(/ROOM:\s*(.+?)(?:\s+DOORS|$)/i);
        const doorsMatch = text.match(/DOORS:\s*(\d+)/i);
        const windowsMatch = text.match(/WINDOWS:\s*(\d+)/i);

        if (roomMatch) roomType = roomMatch[1].trim();
        if (doorsMatch) doors = parseInt(doorsMatch[1]);
        if (windowsMatch) windows = parseInt(windowsMatch[1]);

        console.log(`✅ ANALYSIS - Room: ${roomType}, Doors: ${doors}, Windows: ${windows}`);
      }

      if (imagePart && imagePart.inlineData) {
        const maskData = imagePart.inlineData.data;
        const maskMimeType = imagePart.inlineData.mimeType;
        console.log(`✅ MASK - Success! mimeType=${maskMimeType}, dataLength=${maskData.length}`);

        // ============================================================================
        // MASK IS NOW BINARY - No reconstruction needed!
        // ============================================================================
        // The new two-step prompt produces pure binary masks directly from Gemini.
        // No need for Sharp reconstruction anymore.
        console.log('✅ MASK GENERATION - Mask is already binary, no reconstruction needed');
        let processedMaskData = maskData; // Use the mask as-is

        // DEBUG: Save binary mask to Supabase for inspection
        if (isSupabaseConfigured() && projectId) {
          try {
            const maskBlob = new Blob([
              Uint8Array.from(atob(processedMaskData), c => c.charCodeAt(0))
            ], { type: 'image/png' });

            const debugPath = `${projectId}/debug/mask_binary_${imageId}_${Date.now()}.png`;
            await supabase.storage
              .from('staged-images')
              .upload(debugPath, maskBlob, { upsert: true });

            console.log(`🐛 DEBUG: Binary mask saved to staged-images/${debugPath}`);
          } catch (debugError) {
            console.warn('⚠️ Could not save debug mask:', debugError);
          }
        }

        return { mask: processedMaskData, roomType, doors, windows };
      }
    }

    // NO FALLBACK - Throw error instead of returning null
    throw new Error('Combined analysis+mask failed: No mask image returned from Gemini');

  } catch (error) {
    console.error('❌ Error in combined analysis+mask:', error);
    throw new Error(`Combined analysis+mask failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    if (!body.imageDataUrl || !body.config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Gemini 2.5 Flash Image for staging
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const imageBase64 = await dataUrlToBase64(body.imageDataUrl);
    const mimeType = getMimeType(body.imageDataUrl);

    // ============================================================================
    // STEP 1: Analyze image and generate floor mask in one call
    // ============================================================================
    console.log('🎭 Step 1: Combined analysis + mask generation...');
    const { mask: maskBase64, roomType: detectedRoomType, doors, windows } = await analyzeAndGenerateMask(
      imageBase64,
      mimeType,
      body.imageId,
      body.analysis?.projectId
    );

    // Use manual room type if provided, otherwise use AI-detected
    const roomType = body.manualRoomType || detectedRoomType;
    console.log(`✅ Got room info: ${roomType}${body.manualRoomType ? ' (manual override)' : ' (AI-detected)'}, ${doors} doors, ${windows} windows`);

    // Merge settings with global settings
    const settings = {
      ...body.globalSettings,
      ...body.config.settings,
    };

    // ============================================================================
    // STEP 2: Build staging prompt with mask instructions
    // ============================================================================
    console.log('📝 Step 2: Building staging prompt...');

    const inpaintingPrompt = `You are a professional virtual staging AI.

ROOM ANALYSIS DATA:
- Room type: ${roomType}
- Number of doors: ${doors}
- Number of windows: ${windows}

CRITICAL INSTRUCTIONS:
- You MUST keep all ${doors} door(s) completely visible and unobstructed
- You MUST keep all ${windows} window(s) completely visible and unobstructed
- Do NOT place any furniture in front of doors or windows
- Maintain clear pathways to all doors (minimum 3 feet clearance)

STAGING REQUIREMENTS:
- Style: ${settings.designStyle || 'modern'}
- Color palette: ${settings.colorPalette || 'neutral colors'}
${settings.customAdditions ? `- CUSTOM REQUESTS: ${settings.customAdditions}` : ''}
- Add furniture only to the floor area
- Create realistic shadows for all furniture
- Ensure all architectural elements (doors, windows) remain 100% visible

Use the analysis data above to understand the room layout and stage accordingly.
`;

    console.log('📝 STAGING PROMPT:');
    console.log('=====================================');
    console.log(inpaintingPrompt);
    console.log('=====================================');
    console.log(`📊 Prompt info: doors=${doors}, windows=${windows}, roomType=${roomType}, style=${settings.designStyle || 'modern'}`);

    // ============================================================================
    // STEP 3: Staging with JSON analysis data (2-part API call)
    // ============================================================================
    console.log('🎨 Step 3: Generating staged image with JSON analysis...');
    console.log(`🎨 Sending to gemini-2.5-flash-image: prompt (with JSON data) + image`);

    const parts: any[] = [
      { text: inpaintingPrompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      // MASK BYPASSED - Using JSON analysis data in prompt instead
    ];

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const response = await result.response;

    console.log('🎨 STAGING - Response received');
    console.log('🔍 DEBUG - Full response:', JSON.stringify({
      candidatesCount: response.candidates?.length || 0,
      promptFeedback: response.promptFeedback,
      usageMetadata: response.usageMetadata,
    }, null, 2));

    // Check if response contains generated image
    const candidates = response.candidates;
    let stagedImageUrl = body.imageDataUrl; // Fallback to original
    let stagedThumbnailUrl: string | null = null; // Store thumbnail URL

    console.log(`🎨 STAGING - Candidates: ${candidates?.length || 0}`);

    // Log finish reason for each candidate
    if (candidates && candidates.length > 0) {
      candidates.forEach((candidate: any, idx: number) => {
        console.log(`🔍 DEBUG - Candidate ${idx}: finishReason=${candidate.finishReason}, safetyRatings=${JSON.stringify(candidate.safetyRatings)}`);
      });
    }

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      console.log(`🎨 STAGING - Parts in response: ${parts.length}`);

      // Debug: Show what types of parts we got
      parts.forEach((part: any, idx: number) => {
        console.log(`🔍 DEBUG - Part ${idx}: hasText=${!!part.text}, hasInlineData=${!!part.inlineData}, textLength=${part.text?.length || 0}`);
      });

      // Look for inline data (generated image)
      const imagePart = parts.find((part: any) => part.inlineData);
      console.log(`🎨 STAGING - Found image part: ${!!imagePart}`);

      if (imagePart && imagePart.inlineData) {
        // Convert generated image to data URL
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;

        console.log(`✅ STAGING - Success! Generated image: mimeType=${generatedMimeType}, dataLength=${generatedData.length}`);

        // Upload to Supabase immediately (server-side) with thumbnail generation
        try {
          const projectId = body.projectId || body.analysis?.projectId || 'default';
          const buffer = Buffer.from(generatedData, 'base64');

          // Generate thumbnail (300px wide)
          console.log('📸 Generating thumbnail...');
          const thumbnailBuffer = await sharp(buffer)
            .resize(300, null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          // Get existing results count for version number
          const { data: existingResults } = await supabase
            .from('staging_results')
            .select('id')
            .eq('image_id', body.imageId)
            .eq('project_id', projectId);

          const versionNumber = existingResults?.length || 0;
          const filename = versionNumber === 0 ? 'final.png' : `edit-${versionNumber}.png`;
          const thumbFilename = versionNumber === 0 ? 'final_thumb.jpg' : `edit-${versionNumber}_thumb.jpg`;
          const filePath = `${projectId}/${body.imageId}/${filename}`;
          const thumbPath = `${projectId}/${body.imageId}/${thumbFilename}`;

          // Upload full-size image
          console.log(`📤 Uploading full-size to: ${filePath}`);
          const { error: uploadError } = await supabase.storage
            .from('staged-images')
            .upload(filePath, buffer, {
              contentType: generatedMimeType,
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Upload thumbnail
          console.log(`📤 Uploading thumbnail to: ${thumbPath}`);
          const { error: thumbError } = await supabase.storage
            .from('staged-images')
            .upload(thumbPath, thumbnailBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true,
            });

          if (thumbError) console.warn('⚠️ Thumbnail upload failed:', thumbError);

          // Get public URLs
          const { data: fullUrlData } = supabase.storage
            .from('staged-images')
            .getPublicUrl(filePath);

          const { data: thumbUrlData } = supabase.storage
            .from('staged-images')
            .getPublicUrl(thumbPath);

          stagedImageUrl = fullUrlData.publicUrl;
          stagedThumbnailUrl = thumbError ? null : thumbUrlData.publicUrl;

          console.log(`✅ Uploaded full-size: ${stagedImageUrl}`);
          if (stagedThumbnailUrl) console.log(`✅ Uploaded thumbnail: ${stagedThumbnailUrl}`);

        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          // Fallback to data URL
          stagedImageUrl = `data:${generatedMimeType};base64,${generatedData}`;
        }
      } else {
        console.warn('⚠️ STAGING - No image in response, using fallback (original image)');
      }
    } else {
      console.warn('⚠️ STAGING - No candidates in response, using fallback (original image)');
    }

    // Also get text description if available
    let description = `Professionally staged ${roomType} with ${settings.designStyle || 'modern'} design.`;
    let suggestions = '';

    try {
      const textContent = response.text();
      if (textContent) {
        // Try to parse as JSON for structured data
        const cleanText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        description = parsed.description || description;
        suggestions = parsed.suggestions || '';
      }
    } catch {
      // If not JSON, use the text as-is
      const textContent = response.text();
      if (textContent && textContent.length < 500) {
        description = textContent;
      }
    }

    const stagingResult = {
      imageId: body.imageId,
      roomType: roomType,
      description,
      suggestions: suggestions || `Staged with ${settings.designStyle || 'modern'} furniture and ${settings.colorPalette || 'neutral'} color palette.`,
      stagedImageUrl, // Now contains the actual generated image!
      stagedThumbnailUrl, // Thumbnail URL if generated
      details: {
        furniturePieces: [],
        colorScheme: settings.colorPalette || '',
        decorElements: [],
        furnitureLayout: '',
        textiles: settings.rugStyle || '',
      },
    };

    // ============================================================================
    // SAVE PROJECT AND IMAGE TO DATABASE (NOT THE RESULT - CLIENT WILL DO THAT)
    // ============================================================================
    try {
      console.log('🔍 Starting database save...');
      const { saveProject, saveImage } = await import('@/lib/database');
      const projectId = body.projectId || body.analysis?.projectId || 'default';
      console.log(`🔍 Project ID: ${projectId}`);

      // 1. Ensure project exists in database
      console.log('🔍 Saving project...');
      await saveProject(projectId, {
        name: `Project ${new Date().toLocaleDateString()}`,
        settings: settings,
        metadata: {
          lastGeneratedAt: new Date().toISOString(),
        }
      });
      console.log(`✅ Project saved to database: ${projectId}`);

      // 2. Ensure original image exists in database
      if (body.imageDataUrl) {
        await saveImage({
          id: body.imageId,
          projectId: projectId,
          originalUrl: body.imageDataUrl, // This should be the Supabase URL
          analysis: body.analysis,
          metadata: {
            uploadedAt: new Date().toISOString(),
          }
        });
        console.log(`✅ Image saved to database: ${body.imageId}`);
      }

      // REMOVED: Don't save staging result here - the client will do it via setStagingResult()
      // This prevents duplicate entries in the database
      console.log(`✅ Staging result will be saved by client to avoid duplicates`);
    } catch (dbError) {
      console.error('❌❌❌ DATABASE SAVE FAILED ❌❌❌');
      console.error('Error details:', dbError);
      console.error('Error message:', dbError instanceof Error ? dbError.message : String(dbError));
      console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');
      // Don't fail the request if database save fails
      // The image is already uploaded to storage, so user can still see results
    }

    return NextResponse.json(stagingResult);

  } catch (error) {
    console.error('❌ Staging generation error:', error);

    // Log detailed error info
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's a Gemini API error
    if (typeof error === 'object' && error !== null && 'response' in error) {
      console.error('Gemini API response:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generation failed',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// Simplified lighting hint - just the direction, not the academic physics
function buildSimpleLightingHint(analysis: RoomAnalysis | undefined): string {
  const windowCount = analysis?.windows || 0;

  if (windowCount > 0) {
    return `- Light Source: ${windowCount} window${windowCount > 1 ? 's' : ''} - observe window position(s) in image, cast shadows away from windows`;
  } else {
    return `- Light Source: Artificial ceiling lighting - observe existing room shadows for direction`;
  }
}

// ============================================================================
// LAYER 1: SPATIAL FOUNDATION - Doors, Windows, Pathways
// ============================================================================
function buildSpatialFoundationLayer(analysis: RoomAnalysis): string {
  const features = analysis.features || [];
  const windows = analysis.windows || 0;
  const doors = analysis.doors || 0;
  const doorDetails = analysis.doorDetails || [];

  // Build door information from analysis
  let doorInfo = '';
  if (doors > 0 && doorDetails.length > 0) {
    doorInfo = doorDetails.map((door, idx) => {
      const doorWidth = 32; // Standard average door width in inches
      const clearance = 36; // Standard clearance in inches

      return `- Door ${idx + 1}: ${door.location} - ${door.type} door (${door.state})
  → Estimated Dimensions: Approx. ${doorWidth}" wide
  → ⛔ ABSOLUTELY FORBIDDEN: DO NOT cover, hide, or block this door
  → ⛔ ABSOLUTELY FORBIDDEN: DO NOT place furniture in front of this door
  → FORBIDDEN ZONE: ${clearance}" (3 feet) clearance in front - MUST remain completely empty
  ${door.state === 'open' ? `  → EXTRA CAUTION: Door is OPEN - requires wider swing clearance (consider ${doorWidth + 12}" for swing)` : ''}
  → RULE: Ensure furniture is positioned and sized to respect these dimensions and clearances.`;
    }).join('\n');
  } else if (doors > 0) {
    const doorWidth = 32; // Standard average door width in inches
    const clearance = 36; // Standard clearance in inches
    doorInfo = `- ${doors} door(s) detected in this room
  → Estimated Door Dimensions: Approx. ${doorWidth}" wide each
  → ⛔ ABSOLUTELY FORBIDDEN: DO NOT cover, hide, or block ANY of these ${doors} doors
  → ⛔ ABSOLUTELY FORBIDDEN: DO NOT place furniture in front of ANY door
  → FORBIDDEN ZONE: ${clearance}" (3 feet) clearance in front of EACH door
  → RULE: First identify ALL ${doors} door locations in the image, then keep them 100% visible and clear. Ensure furniture is positioned and sized to respect these dimensions and clearances.`;
  } else {
    // Fallback to feature detection
    const doorFeatures = features.filter(f =>
      f.toLowerCase().includes('door') ||
      f.toLowerCase().includes('entry') ||
      f.toLowerCase().includes('archway')
    );
    doorInfo = doorFeatures.length > 0
      ? doorFeatures.map(f => `- ${f}\n  → ⛔ DO NOT cover or block this opening\n  → FORBIDDEN ZONE: 36" clearance - MUST remain empty`).join('\n')
      : `- Assume 1-2 doorways exist (standard for ${analysis.roomType})\n  → ⛔ DO NOT cover or block ANY doors\n  → FORBIDDEN ZONE: 36" clearance in front of all doors\n  → RULE: Identify door locations in image first, keep them 100% visible`;
  }

  // Detect windows
  const windowInfo = windows > 0
    ? `\n🪟 WINDOWS:\n- Count: ${windows} window(s)\n- Location: Visible in image\n- CRITICAL RULE: Do NOT place tall furniture in front of windows\n- PRESERVE: Natural light pathways and window views`
    : '';

  // Traffic pathway info
  const pathwayInfo = doors > 0
    ? `\n🚶 TRAFFIC PATHWAYS:\n- Clear pathways required between ALL ${doors} doors\n- Minimum width: 36 inches (3 feet)\n- CRITICAL RULE: These zones MUST remain completely clear of furniture`
    : '\n🚶 TRAFFIC PATHWAYS:\n- Maintain 36" clear pathway from entry to center of room';

  return `
==============================================
LAYER 1: SPATIAL FOUNDATION (HIGHEST PRIORITY)
==============================================

${analysis.roomType.toUpperCase()} - ${analysis.dimensions?.estimated || 'Standard size'}

🚪 DOORS & OPENINGS (${doors} DETECTED):
${doorInfo}
${windowInfo}${pathwayInfo}

🏗️ STRUCTURAL ELEMENTS TO PRESERVE:
${features.length > 0
  ? features.filter(f => !f.toLowerCase().includes('door')).map(f => `- ${f} (DO NOT MODIFY)`).join('\n')
  : '- All walls, ceilings, floors (DO NOT MODIFY)\n- Any built-in features visible in image'
}

🚨 CRITICAL SPATIAL RULES (VIOLATION = FAILURE):
⛔ STEP 1: Identify ALL ${doors} door(s) in the image - look at the image carefully and locate each door
⛔ STEP 2: Identify ALL ${windows} window(s) in the image - locate each window
⛔ STEP 3: DO NOT cover, hide, or block ANY of these doors or windows with furniture
✓ STEP 4: Only THEN place furniture in the remaining open floor space
✓ All doorways and passages MUST have 36" minimum clearance (completely empty)
✓ Windows MUST remain 100% visible (no tall furniture in front)
✓ Traffic paths MUST be clear and unobstructed
✓ Every door MUST be fully visible in the final staged image

⚠️ COMMON MISTAKE TO AVOID: Do not place a dresser, wardrobe, bed, or any furniture that would cover a door or closet door.
`;
}

// ============================================================================
// LAYER 2: DIMENSIONAL CONSTRAINTS - Furniture Sizing
// ============================================================================
function buildDimensionalLayer(roomType: string): string {
  const dimensions: Record<string, string> = {
    'Living Room': `
Living Room Furniture - EXACT SIZES:
• Standard Sofa: 84"W × 36"D × 32"H (7 feet wide MAX)
• Loveseat: 58"W × 36"D (5 feet wide)
• Armchair: 32"W × 34"D (under 3 feet)
• Coffee Table: 48"W × 24"D × 18"H (4 feet long, LOW height)
• Side Table: 20"W × 20"D × 24"H (2 feet square)
• Media Console: 60"W × 18"D × 24"H
• Area Rug: 8'×10' or 9'×12' (front legs of furniture ON rug)

Clearance Requirements:
• 18" between coffee table and sofa
• 30" walking paths around furniture
• TV viewing distance: 7-10 feet from seating`,

    'Bedroom': `
Bedroom Furniture - EXACT SIZES:
• Queen Bed: 60"W × 80"L (headboard MUST be against wall)
• King Bed: 76"W × 80"L (only for large rooms >12'×12')
• Nightstand: 24"W × 18"D × 24-28"H (one on each side)
• Dresser: 60"W × 18"D × 32"H (against wall, not blocking closet)
• Bench (foot of bed): 48"W × 18"D × 18"H (optional)

Clearance Requirements:
• 24" minimum on sides of bed (30" preferred)
• 36" at foot of bed for walking
• 36" in front of dresser for drawer opening`,

    'Dining Room': `
Dining Room Furniture - EXACT SIZES:
• 4-Person Table: 42"W × 42"L (round or square)
• 6-Person Table: 72"W × 36"W (rectangular)
• 8-Person Table: 84"W × 40"W (rectangular)
• Dining Chair: 18"W × 20"D × 36"H total (18" seat height)
• Buffet/Sideboard: 60"W × 18"D × 36"H (against wall)

Clearance Requirements:
• 36" from table edge to wall (minimum)
• 42" from table edge to wall (preferred for chair pullout)
• 24" between chair centers
• Chandelier: 30-36" above table surface`,

    'Home Office': `
Home Office Furniture - EXACT SIZES:
• Desk: 60"W × 30"D × 29"H (standard height)
• Office Chair: 24"W × 24"D (with casters)
• Bookshelf: 36"W × 12"D × 72"H (against wall)
• Filing Cabinet: 15"W × 24"D × 28"H (beside or under desk)

Clearance Requirements:
• 36" behind chair for pullout/movement
• 30" in front of bookcases
• Desk should face window OR wall (not door)`,

    'Kitchen': `
Kitchen Furniture - EXACT SIZES:
• Kitchen Island: 36-42"W × 24"D × 36"H (if space allows)
• Bar Stool: 16"W × 16"D × 30" seat height
• Kitchen Table (small): 30"W × 48"L
• Dining Chair: 18"W × 20"D

Clearance Requirements:
• 42" walkways around island
• 36" between counters (galley kitchen)
• 15" landing space beside appliances`
  };

  const roomKey = Object.keys(dimensions).find(key =>
    roomType.toLowerCase().includes(key.toLowerCase())
  );

  return `
==============================================
LAYER 2: DIMENSIONAL CONSTRAINTS
==============================================

${roomKey ? dimensions[roomKey] : dimensions['Living Room']}

⚠️ SIZING RULES:
• Furniture should occupy 50-60% of floor space (NOT more)
• Leave negative space - rooms should NOT feel cramped
• Scale furniture to room size - bigger rooms can handle bigger furniture
• When in doubt, go SMALLER rather than larger

📐 PROPORTIONS:
• Art above sofa: 2/3 to 3/4 width of sofa
• Rug: Should extend 12-18" beyond furniture edges
• Coffee table: 2/3 length of sofa
`;
}

// ============================================================================
// LAYER 3: FUNCTIONAL ZONING - Room-Specific Layout Rules
// ============================================================================
function buildFunctionalZoningLayer(roomType: string): string {
  const zones: Record<string, string> = {
    'Living Room': `
PRIMARY ZONE - Conversation/TV Viewing:
• Seating arrangement in U-shape or L-shape
• All seating faces focal point (TV, fireplace, or window view)
• Max 10 feet between facing seats
• Coffee table in center, accessible from all seats

SECONDARY ZONE - Circulation:
• Clear path from entry to seating area
• No furniture blocking traffic flow
• Walking path AROUND seating group (not through)

ACCENT ELEMENTS:
• Floor lamp beside reading chair
• Side tables within arm's reach of seating
• Plants in corners or beside windows
• Bookshelf or console against wall`,

    'Bedroom': `
PRIMARY ZONE - Sleep:
• Bed headboard against longest solid wall
• NOT under window (disrupts sleep)
• Symmetrical nightstands on both sides
• Sight line to door from bed (security)

SECONDARY ZONE - Dressing:
• Dresser against wall, not blocking closet
• Mirror above dresser or on wall
• Hamper in closet or corner

OPTIONAL ZONES:
• Reading nook: Corner chair + floor lamp + side table
• Workspace: Small desk facing window
• Seating area: Two chairs + small table (if room >12'×14')`,

    'Dining Room': `
PRIMARY ZONE - Dining:
• Table centered in room OR under chandelier
• Equal space on all sides for chair pullout (36-42")
• Chairs evenly spaced around table

SECONDARY ZONE - Storage/Display:
• Buffet or sideboard against wall
• Bar cart in corner
• China cabinet against wall

FLOW:
• Clear path from kitchen (if adjacent)
• Clear path from living area
• No furniture blocking doorways`,

    'Home Office': `
PRIMARY ZONE - Workspace:
• Desk placement: Facing window (natural light) OR facing wall (focus)
• NOT with back to door (creates discomfort)
• Desk centered on wall OR in corner

SECONDARY ZONE - Storage:
• Bookshelf behind or beside desk
• Filing cabinet beside or under desk
• Storage ottoman or cabinet

ERGONOMICS:
• Monitor at arm's length, top at eye level
• Chair should roll on floor or rug pad
• Task lighting on desk`,

    'Kitchen': `
FUNCTIONAL LAYOUT:
• Work Triangle: Sink ↔ Stove ↔ Refrigerator
• Total triangle: 12-26 feet ideal
• No appliance obstructed

SEATING (if space):
• Island with bar stools (42" clearance behind stools)
• Small table in breakfast nook
• Minimum 36" clearance around table

STORAGE:
• Open shelving on walls
• Pot rack above island
• Wine rack or cart in corner`
  };

  const roomKey = Object.keys(zones).find(key =>
    roomType.toLowerCase().includes(key.toLowerCase())
  );

  return `
==============================================
LAYER 3: FUNCTIONAL ZONING
==============================================

${roomKey ? zones[roomKey] : zones['Living Room']}
`;
}

// ============================================================================
// LAYER 4: STYLE CONSISTENCY - Design Language Rules
// ============================================================================
function buildStyleLayer(settings: Partial<DesignSettings>): string {
  const style = settings.designStyle || 'Contemporary';
  const colorPalette = settings.colorPalette || 'Neutral tones';

  return `
==============================================
LAYER 4: STYLE CONSISTENCY
==============================================

DESIGN STYLE: ${style}
${getStyleGuidelines(style)}

COLOR PALETTE: ${colorPalette}
• 60% Dominant color: ${colorPalette.split(',')[0] || 'Neutral base'}
• 30% Secondary: Upholstery, curtains, rug
• 10% Accent: Pillows, art, accessories

MATERIAL CONSISTENCY:
${settings.woodFinish ? `• Wood Finish: ${settings.woodFinish} (use ONLY this wood tone)` : ''}
${settings.metalAccents ? `• Metal Accents: ${settings.metalAccents} (use ONLY this metal finish)` : ''}
${settings.flooring ? `• Flooring Style: ${settings.flooring}` : ''}

DECOR ELEMENTS:
${settings.wallDecor ? `• Wall Decor: ${settings.wallDecor}` : '• Wall Decor: 1-2 pieces of art, not overcrowded'}
${settings.rugStyle ? `• Rug: ${settings.rugStyle}` : '• Rug: Matches color palette, appropriate size'}
${settings.windowTreatments ? `• Windows: ${settings.windowTreatments}` : '• Windows: Simple treatments or bare'}
${settings.greenery ? `• Plants: ${settings.greenery}` : '• Plants: 1-2 medium-sized plants'}
${settings.accents ? `• Accents: ${settings.accents}` : '• Accents: Minimal, purposeful'}

🎨 PATTERN MIXING RULES:
• Maximum 3 patterns in room
• Vary scale: One large, one medium, one small
• Share at least one color across all patterns
`;
}

function getStyleGuidelines(style: string): string {
  const guidelines: Record<string, string> = {
    'modern': '• Clean lines, minimal ornamentation\n• Low-profile furniture\n• Glass, metal, leather materials\n• Geometric shapes\n• Avoid: Ornate details, heavy drapery',
    'contemporary': '• Current, updated look\n• Mix of textures\n• Neutral with color pops\n• Curved and straight lines\n• Avoid: Too matchy-matchy',
    'traditional': '• Classic furniture with details\n• Warm, rich colors\n• Wood furniture (mahogany, cherry)\n• Symmetrical arrangements\n• Avoid: Ultra-modern pieces',
    'transitional': '• Blend of traditional + modern\n• Neutral palette with texture\n• Clean-lined traditional furniture\n• Mix of materials\n• Avoid: Extremes of either style',
    'scandinavian': '• Light, airy feel\n• White/light gray base\n• Natural wood (light tones)\n• Minimal decor\n• Avoid: Dark, heavy furniture',
    'industrial': '• Exposed materials (brick, metal)\n• Reclaimed wood\n• Vintage Edison lighting\n• Raw, unfinished look\n• Avoid: Overly polished pieces',
    'bohemian': '• Layered textiles\n• Mix of patterns\n• Global-inspired pieces\n• Plants and natural elements\n• Avoid: Matchy sets',
    'minimalist': '• Only essential furniture\n• Neutral colors\n• Hidden storage\n• Clean surfaces\n• Avoid: Clutter, excess decor'
  };

  for (const [key, value] of Object.entries(guidelines)) {
    if (style.toLowerCase().includes(key)) {
      return value;
    }
  }

  return guidelines['contemporary'];
}

// ============================================================================
// STANDARD STAGING PROMPT (Toggle OFF or Image 1)
// ============================================================================
function buildStandardStagingPrompt(
  body: GenerateRequest,
  settings: Partial<DesignSettings>,
  styleGuideSection: string,
  layer2: string,
  layer3: string,
  roomType: string = 'Room',
  doors: number = 0,
  windows: number = 0
): string {
  return `You are a professional virtual staging AI.

TASK: Fill the white-masked area of the original image with staged furniture.
All black-masked areas MUST remain 100% identical to the original image.

🎭 MASK = TECHNICAL COMMAND (Not a Suggestion):
- You will receive a BLACK and WHITE mask image
- BLACK pixels = FORBIDDEN - you CANNOT edit these pixels (walls, doors, windows, ceiling, trim)
- WHITE pixels = ALLOWED - you CAN edit these pixels (floor only)
- This is a TECHNICAL constraint, not a creative suggestion
- You are technically unable to modify black pixels

🚨🚨🚨 CRITICAL PRESERVATION RULES 🚨🚨🚨
The mask protects:
- ALL ${doors || 0} doors (including closet doors) = BLACK in mask
- ALL ${windows || 0} windows = BLACK in mask
- All walls, ceilings, baseboards, trim = BLACK in mask
- Only the floor = WHITE in mask

⛔ ABSOLUTELY FORBIDDEN:
❌ DO NOT edit any BLACK pixels in the mask
❌ DO NOT modify walls, doors, windows, ceiling, trim, baseboards
❌ DO NOT place furniture outside the white-masked floor area

✅ YOU MAY ONLY:
✓ Add furniture within the WHITE floor area of the mask
✓ Add rugs within the WHITE floor area
✓ Add decor items that fit within the WHITE area

--- STAGING INSTRUCTIONS ---
- ROOM: ${roomType}
${settings.customAdditions ? `- CUSTOM REQUESTS: ${settings.customAdditions}` : ''}

--- PRESET CONSTRAINTS (MUST FOLLOW) ---
- DESIGN STYLE: ${settings.designStyle || 'Modern Contemporary'}
- COLOR PALETTE: ${settings.colorPalette || 'Neutral tones'}
- WOOD FINISH: ${settings.woodFinish || 'Natural wood tones'}
- METAL ACCENTS: ${settings.metalAccents || 'Brushed nickel'}
- FURNITURE STYLE: ${settings.furnitureStyle || 'Contemporary pieces'}
- RUG STYLE: ${settings.rugStyle || 'Neutral area rug'}
- GREENERY: ${settings.greenery || 'Minimal plants'}
${styleGuideSection}
${layer2}
${layer3}

--- LIGHTING & SHADOWS (CRITICAL FOR REALISM) ---
Match all perspective, lighting, and shadow from the original image.

Every piece of furniture MUST have these 3 shadow types:

1. CONTACT SHADOW (Most Important):
   - Dark, soft shadow where furniture touches the floor/rug
   - This prevents the "floating" appearance
   - Must be directly under furniture legs/bases
   - Soft-edged, dark pools of shadow

2. CAST SHADOW (Directional):
   - Soft shadow extending away from the light source
   - Must match the direction of existing shadows in the room
   - Follow the natural light from windows

3. AMBIENT OCCLUSION (Depth):
   - Subtle darkening in crevices and corners
   - Darken under cushions and where furniture meets walls
   - Add depth under tables, behind furniture
   - Darken inside shelving units

Focus on creating beautiful, realistic staging with hyper-realistic shadows integrated into the scene.

🚨 FINAL REMINDER - READ THIS BEFORE GENERATING:
1. You have a MASK image - BLACK pixels CANNOT be edited (this is a technical constraint)
2. The mask protects ${doors || 0} door(s) - they are BLACK in the mask
3. ONLY edit the WHITE pixels (floor area)
4. BLACK areas (walls, doors, windows) MUST remain identical to original image
5. This is not a suggestion - the mask is a technical command

The mask defines the editable area. Focus on creating beautiful, realistic staging within the white-masked floor area with hyper-realistic shadows.
`;
}

// ============================================================================
// SPATIAL CONSISTENCY PROMPT (Toggle ON - Visual Transfer)
// ============================================================================
function buildSpatialConsistencyPrompt(
  body: GenerateRequest,
  settings: Partial<DesignSettings>,
  styleGuideSection: string,
  roomType: string = 'Room'
): string {
  return `You are a spatial consistency AI. You will be given FOUR inputs:
1. This text prompt
2. A "Target Image" (an empty room from a new angle) - IMAGE 1
3. A "Mask" (defining the editable floor area of the Target Image) - IMAGE 2
4. A "Reference Image" (the *same room* staged with furniture from a different angle) - IMAGE 3

TASK:
Stage the "Target Image" by "transferring" the furniture from the "Reference Image" into the new perspective.

CRITICAL RULES:
1. **PRESERVE TARGET ARCHITECTURE:** Use the "Mask" to preserve all walls, windows, doors, and architecture of the "Target Image". The mask shows which pixels you can edit (white = floor) vs must preserve (black = everything else).

2. **IDENTIFY & ANALYZE:** Look at the "Reference Image" and identify the key furniture pieces:
   - What is the primary furniture? (e.g., bed, sofa, dining table)
   - What are the secondary pieces? (e.g., nightstands, side tables, chairs)
   - What are the accent pieces? (e.g., rug, plants, lamps, art)

3. **RE-CREATE EXACT SAME PIECES:** Re-create those *exact same* pieces of furniture in the "Target Image":
   - SAME style (e.g., if the bed has a tufted headboard, the target must too)
   - SAME color (e.g., if the sofa is charcoal gray, the target must be charcoal gray)
   - SAME materials (use the Project Style Guide below for exact material names)
   - SAME scale (this is critical - if the bed looks like a Queen, it must be a Queen in target too)

4. **LOGICAL PLACEMENT:** Place the furniture logically in the new perspective:
   - If the bed is against the left wall in reference, find its corresponding position in target
   - Maintain the same spatial relationships (e.g., nightstands still beside bed)
   - Consider that some furniture from the reference may be visible from this new angle
   - The two images show the SAME PHYSICAL SPACE from different angles

5. **MATCH SCALE PRECISELY:** The scale of the furniture must be consistent:
   - Use visual cues from both images (windows, doors, ceiling height)
   - A 7-foot sofa in the reference should be a 7-foot sofa in the target
   - Furniture should occupy similar proportions of floor space

6. **MAINTAIN SHADOWS & REALISM:** Every piece of furniture MUST have:
   - CONTACT SHADOW: Dark shadow where furniture touches floor
   - CAST SHADOW: Directional shadow from light source
   - AMBIENT OCCLUSION: Darkening in crevices and corners

This is a visual-spatial reasoning task. The final image must look like the *same furniture* in the *same room*, just viewed from a new angle.

${styleGuideSection}

--- TARGET ROOM ANALYSIS ---
- ROOM: ${roomType}
${settings.customAdditions ? `- CUSTOM REQUESTS: ${settings.customAdditions}` : ''}

OUTPUT: Generate a staged image of the Target room that looks like the Reference room from a new angle.
`;
}

// ============================================================================
// LAYER 5: TECHNICAL REFINEMENT - Shadows, Physics, Realism
// ============================================================================
function buildTechnicalLayer(analysis: RoomAnalysis): string {
  const lightingHint = analysis.windows && analysis.windows > 0
    ? `Natural light from ${analysis.windows} window(s)`
    : 'Artificial ceiling lighting';

  return `
==============================================
LAYER 5: TECHNICAL REFINEMENT
==============================================

LIGHTING ANALYSIS:
• Source: ${lightingHint}
• Rule: Analyze existing shadows in the image to determine light direction
• All added furniture MUST match this shadow direction

🌑 SHADOW REQUIREMENTS (CRITICAL FOR REALISM):

Every piece of furniture MUST have these 3 shadow types:

1. CONTACT SHADOW (Most Important):
   - Dark shadow where furniture touches floor
   - Darkest at exact contact point (legs, base)
   - Prevents "floating" appearance
   - This is what makes furniture look real vs. pasted

2. CAST SHADOW (Directional):
   - Soft shadow extending away from light source
   - Match direction of existing shadows in room
   - Lighter and softer than contact shadow
   - Length varies by distance from light

3. FORM SHADOW (Depth):
   - Darker side of furniture away from light
   - Crevice darkening where parts meet
   - Under cushions, behind furniture
   - Creates three-dimensional appearance

Shadow Quality:
• Near windows: Softer, lighter shadows
• Away from windows: Sharper, darker shadows
• ALL furniture must cast consistent shadow direction
• Shadows should look natural, not artificial

⚖️ PHYSICS & REALISM:

GRAVITY:
• All furniture must appear grounded (not floating)
• Heavy items (sofas, tables) sit firmly on floor
• Contact shadows reinforce weight

MATERIALS:
• Fabrics drape naturally (curtains, throw blankets)
• Cushions show slight compression when "sat on"
• Rugs lie flat with realistic edges/corners
• Wood has natural grain and slight variations

LIGHTING BEHAVIOR:
• Surfaces facing light source are brighter
• Surfaces away from light are darker
• Reflective surfaces (glass, metal) show highlights
• Matte surfaces (fabric, wood) diffuse light

🔍 FINAL VALIDATION:

Before completing, verify:
✓ No furniture appears to "hover" - all have contact shadows
✓ Shadow directions are consistent across ALL elements
✓ Materials look realistic (wood grain, fabric texture)
✓ Lighting matches the original room
✓ Nothing looks "pasted on" - everything integrates naturally
`;
}
