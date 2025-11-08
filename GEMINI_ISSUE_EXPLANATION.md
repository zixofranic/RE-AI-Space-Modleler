# 🏠 Virtual Staging Project - Gemini Image Editing Challenge

## Project Overview

We're building an **AI Virtual Staging application** for real estate that adds furniture and decor to empty room photos. The critical requirement is **image editing** (adding elements to an existing photo), NOT generating a new room from scratch.

---

## What We're Trying to Achieve

### Input:
- An empty room photo (e.g., bedroom with white walls, hardwood floor, windows)

### Desired Output:
- **THE SAME ROOM** with furniture and decor added
- All architectural features preserved exactly (walls, floors, windows, doors, ceiling)
- Only furniture, rugs, artwork, and staging elements added
- Shadows and lighting match the original photo

### Critical Requirement:
**This is an IMAGE EDITING task** - we need to ADD elements to the existing photo, not generate a completely different room.

---

## The Problem We're Facing

**Issue:** Gemini is generating **completely new rooms** instead of editing the provided image.

### What's Happening:
1. User uploads a photo of an empty bedroom with:
   - Beige walls
   - Light hardwood flooring
   - Two windows on the right wall
   - One door on the left wall
   - White ceiling with recessed lighting

2. Gemini returns an image with:
   - **Different wall colors** (gray instead of beige)
   - **Different flooring** (carpet instead of hardwood)
   - **Different window positions** or count
   - **Different room dimensions**
   - Essentially a brand new room that just happens to be a bedroom

### Why This Is Critical:
- Real estate professionals need to show **their actual property** with staging
- Changing the room architecture is misleading and unusable
- Clients need to recognize their own space with furniture added

---

## Our Current Approach

### Model & Configuration:
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image'
});

const result = await model.generateContent({
  contents: [
    {
      role: 'user',
      parts: [
        { text: promptText },  // Our detailed prompt below
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ],
    },
  ],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],  // Required for image output
  },
});
```

### Our Prompt Structure:

We use a hierarchical prompt with multiple layers:

#### 1. IMAGE EDITING INSTRUCTION (Top Priority)
```
==============================================
IMAGE EDITING INSTRUCTION (MOST CRITICAL)
==============================================

🎯 TASK: Using the provided image, add furniture and staging to THIS EXACT room.

⚠️ PRESERVATION REQUIREMENTS (ABSOLUTE):
• Keep the room architecture EXACTLY as shown in the image
• Preserve ALL walls, floors, ceilings, windows, doors, moldings, and architectural features
• Maintain the EXACT room dimensions and layout from the original photo
• Keep the original lighting, shadows, and ambient conditions
• Do NOT change wall colors, flooring, or any existing structural elements
• Do NOT add or remove windows, doors, or openings
• Do NOT modify the camera angle, perspective, or room boundaries

✅ WHAT TO ADD:
• Furniture appropriate for a [ROOM_TYPE]
• Decor items (rugs, pillows, artwork, plants)
• Ensure all additions integrate naturally with existing lighting and perspective

This is an IMAGE EDITING task - you are ADDING elements to an existing photo,
not generating a new room from scratch.
```

#### 2. SPATIAL FOUNDATION
- Door clearances (36" minimum)
- Window preservation (don't block with furniture)
- Traffic pathway requirements
- Structural elements to preserve

#### 3. DIMENSIONAL CONSTRAINTS
- Exact furniture sizes (e.g., "Queen Bed: 60"W × 80"L")
- Clearance requirements
- Scaling rules (50-60% floor coverage)

#### 4. FUNCTIONAL ZONING
- Primary zones (e.g., bed placement for bedroom)
- Secondary zones (dresser, seating)
- Proper furniture arrangement

#### 5. STYLE CONSISTENCY
- User-selected design style
- Color palette rules
- Material consistency

#### 6. TECHNICAL REFINEMENT
- Shadow requirements (contact, cast, form shadows)
- Physics and realism
- Lighting behavior

#### 7. NEGATIVE PROMPTS
```
❌ NEVER:
• Change the room architecture, layout, or dimensions
• Modify walls, floors, ceilings, windows, or doors
• Create a different room than what's shown in the image
• Generate a new room from scratch
```

#### 8. FINAL COMMAND
```
Using the provided image, add professionally staged furniture and decor to this [ROOM_TYPE],
following ALL layers above.

🔒 ABSOLUTE RULE: Preserve the exact room architecture, walls, floors, windows, doors,
and lighting from the original image. Only add furniture and decor - do not regenerate the room.
```

---

## What We've Tried

1. **Emphasized "IMAGE EDITING" at the top**
   - Result: Still generates new rooms

2. **Used CAPS and emojis for critical rules**
   - Result: Minimal improvement

3. **Repeated preservation requirements multiple times**
   - Result: Gemini still changes architecture

4. **Added extensive negative prompts**
   - Result: Sometimes works, often doesn't

5. **Placed preservation rules at TOP of prompt**
   - Result: Inconsistent behavior

6. **Used specific language like "DO NOT generate a new room"**
   - Result: Gemini still generates new rooms ~50% of the time

---

## Questions & Request for Guidance

### 1. Is `gemini-2.5-flash-image` the right model for image editing?
- Should we be using a different model or API endpoint?
- Is there a specific image-to-image editing mode we should enable?

### 2. Prompt Structure - What's the best approach?
- Should IMAGE EDITING instruction be at the top, middle, or bottom?
- Do longer, detailed prompts hurt or help?
- Is there a specific phrase or keyword that triggers "edit mode" vs "generate mode"?

### 3. Are we using the API correctly?
```typescript
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
}
```
- Is this the correct configuration?
- Are there additional parameters we should set?
- Should we be using a different generation config?

### 4. Prompt Engineering Best Practices
- **Hierarchical structure** (our current approach) vs **simple concise prompt**?
- **Repetition** of key rules vs **single clear statement**?
- **Negative prompts** effectiveness - should they be emphasized more?
- **Visual markers** (emojis, separators, CAPS) - do they help or hurt?

### 5. Technical Approach
- Should we try **multiple API calls** (e.g., first call to understand the room, second to add furniture)?
- Would **providing a mask** or **region specification** help?
- Are there **experimental features** or **preview models** better suited for this?

### 6. What works best for image preservation?
We need Gemini to:
1. **Analyze** the input image (understand the room)
2. **Preserve** everything that exists
3. **Add** new elements (furniture) that blend naturally
4. **Return** the edited image, not a generated one

What's the recommended prompt pattern or API approach for this workflow?

---

## Ideal Outcome

**We want Gemini to:**
1. Recognize this is an editing task, not a generation task
2. Preserve 100% of the original room architecture
3. Add furniture and decor that:
   - Matches the room's lighting and perspective
   - Has proper shadows and physics
   - Follows the design style we specify
   - Looks naturally integrated (not "pasted on")

**Success looks like:**
- Original photo: Empty bedroom with beige walls, hardwood floors
- Gemini output: **Same bedroom** with beige walls and hardwood floors, now with a bed, nightstands, dresser, rug, and artwork

---

## Request for Help

**What is the best approach to make Gemini reliably EDIT the provided image instead of GENERATING a new room?**

Specific areas where we need guidance:
1. ✅ Model selection (is gemini-2.5-flash-image correct?)
2. ✅ Prompt structure (what format works best for preservation?)
3. ✅ API configuration (are we missing critical parameters?)
4. ✅ Prompt engineering patterns (what language triggers editing vs generation?)
5. ✅ Technical alternatives (should we try a different approach entirely?)

Any suggestions, examples, or documentation references would be greatly appreciated!

---

## Additional Context

- **Use Case:** Real estate virtual staging
- **Volume:** Processing 10-50 images per project
- **User Expectations:** See their actual room with furniture, not a different room
- **Current Success Rate:** ~50% preservation (unacceptable for production)
- **Target Success Rate:** 95%+ preservation

Thank you for any guidance you can provide! 🙏
