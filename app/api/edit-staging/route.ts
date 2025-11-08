import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface EditRequest {
  imageDataUrl: string; // Current staged image
  editInstruction: string; // What to change
  roomType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EditRequest = await request.json();

    if (!body.imageDataUrl || !body.editInstruction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Gemini 2.5 Flash Image for image editing
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const imageBase64 = await dataUrlToBase64(body.imageDataUrl);
    const mimeType = getMimeType(body.imageDataUrl);

    // SIMPLIFIED edit prompt - focus on the most critical rules
    const editPrompt = `IMAGE EDITING TASK - Make ONLY the requested change:

USER REQUEST: "${body.editInstruction}"

🚨 CRITICAL RULES:

❌ DO NOT:
- Block doorways, archways, or passages with new furniture
- Change walls, windows, doors, or architectural elements
- Make changes beyond what was requested
- Add furniture without contact shadows on floor

✅ WHEN ADDING FURNITURE:
1. Use realistic sizes (sofa 84"W, chairs 32"W, coffee table 48"W)
2. Place away from doorways (minimum 3 feet clearance)
3. Add dark shadow where it touches floor
4. Match shadow direction of existing furniture

✅ WHEN REMOVING FURNITURE:
- Remove the object AND its shadows completely
- Restore floor texture seamlessly

✅ WHEN CHANGING FURNITURE:
- Change only the specified attribute (color, style, etc.)
- Keep shadows and position if not mentioned

VALID EXAMPLES:
✅ "Remove bookshelf" → Delete it + shadows
✅ "Change sofa to blue" → Recolor only
✅ "Add coffee table" → Add with proper shadows
✅ "Make rug smaller" → Resize appropriately

INVALID EXAMPLES:
❌ "Close the doorway" → Cannot modify architecture
❌ "Add a wall" → Cannot change structure

Generate edited image following the request and rules above.`;

    // Generate edited image
    const result = await model.generateContent([
      editPrompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;

    // Extract generated image
    const candidates = response.candidates;
    let editedImageUrl = body.imageDataUrl; // Fallback to original

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        editedImageUrl = `data:${generatedMimeType};base64,${generatedData}`;
      }
    }

    return NextResponse.json({
      success: true,
      editedImageUrl,
      instruction: body.editInstruction,
    });

  } catch (error) {
    console.error('Image editing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Edit failed',
        success: false
      },
      { status: 500 }
    );
  }
}
