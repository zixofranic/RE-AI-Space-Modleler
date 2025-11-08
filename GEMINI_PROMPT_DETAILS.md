# 🤖 Gemini API - Staging Generation Details

## Model Used
```
gemini-2.5-flash-image
```

## API Configuration

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image'
});

const result = await model.generateContent({
  contents: [
    {
      role: 'user',
      parts: [
        { text: imageStagingPrompt },  // The full prompt below
        {
          inlineData: {
            mimeType: 'image/jpeg',  // or 'image/png'
            data: imageBase64,       // Base64-encoded image
          },
        },
      ],
    },
  ],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],  // CRITICAL for image generation
  },
});
```

---

## Complete Prompt Structure

### 1. IMAGE EDITING INSTRUCTION (Top Priority)

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
• Furniture appropriate for a [ROOM_TYPE - e.g., "Bedroom"]
• Decor items (rugs, pillows, artwork, plants)
• Ensure all additions integrate naturally with existing lighting and perspective

This is an IMAGE EDITING task - you are ADDING elements to an existing photo, not generating a new room from scratch.
```

### 2. LAYER 1: SPATIAL FOUNDATION

```
==============================================
LAYER 1: SPATIAL FOUNDATION (HIGHEST PRIORITY)
==============================================

[ROOM_TYPE] - [DIMENSIONS]

🚪 DOORS & OPENINGS:
- Entry door visible in image
  → FORBIDDEN ZONE: 36" (3 feet) clearance in front
  → RULE: NO furniture within this zone

🪟 WINDOWS:
- Count: [X] window(s)
- Location: Visible in image
- CRITICAL RULE: Do NOT place tall furniture in front of windows
- PRESERVE: Natural light pathways and window views

🚶 TRAFFIC PATHWAYS:
- Clear pathways required from doors to main areas
- Minimum width: 36 inches (3 feet)
- CRITICAL RULE: These zones MUST remain completely clear of furniture

🏗️ STRUCTURAL ELEMENTS TO PRESERVE:
- Ceiling fan/light fixture (DO NOT MODIFY)
- Crown molding (DO NOT MODIFY)
- All walls, ceilings, floors (DO NOT MODIFY)

🚨 CRITICAL SPATIAL RULES:
✓ All doorways, archways, and passages must have 36" minimum clearance
✓ Windows must NOT be blocked by furniture
✓ Traffic paths must be clear and unobstructed
✓ Identify these zones in the image FIRST before placing any furniture
```

### 3. LAYER 2: DIMENSIONAL CONSTRAINTS

**Example for Bedroom:**

```
==============================================
LAYER 2: DIMENSIONAL CONSTRAINTS
==============================================

Bedroom Furniture - EXACT SIZES:
• Queen Bed: 60"W × 80"L (headboard MUST be against wall)
• King Bed: 76"W × 80"L (only for large rooms >12'×12')
• Nightstand: 24"W × 18"D × 24-28"H (one on each side)
• Dresser: 60"W × 18"D × 32"H (against wall, not blocking closet)
• Bench (foot of bed): 48"W × 18"D × 18"H (optional)

Clearance Requirements:
• 24" minimum on sides of bed (30" preferred)
• 36" at foot of bed for walking
• 36" in front of dresser for drawer opening

⚠️ SIZING RULES:
• Furniture should occupy 50-60% of floor space (NOT more)
• Leave negative space - rooms should NOT feel cramped
• Scale furniture to room size - bigger rooms can handle bigger furniture
• When in doubt, go SMALLER rather than larger

📐 PROPORTIONS:
• Art above bed: 2/3 to 3/4 width of bed
• Rug: Should extend 12-18" beyond furniture edges
```

### 4. LAYER 3: FUNCTIONAL ZONING

**Example for Bedroom:**

```
==============================================
LAYER 3: FUNCTIONAL ZONING
==============================================

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
• Seating area: Two chairs + small table (if room >12'×14')
```

### 5. LAYER 4: STYLE CONSISTENCY

```
==============================================
LAYER 4: STYLE CONSISTENCY
==============================================

DESIGN STYLE: [USER_SELECTED - e.g., "Contemporary"]

• Clean lines, minimal ornamentation
• Low-profile furniture
• Glass, metal, leather materials
• Geometric shapes
• Avoid: Ornate details, heavy drapery

COLOR PALETTE: [USER_SELECTED - e.g., "Neutral tones"]
• 60% Dominant color: Beige/cream base
• 30% Secondary: Upholstery, curtains, rug
• 10% Accent: Pillows, art, accessories

MATERIAL CONSISTENCY:
• Wood Finish: [e.g., "Walnut"] (use ONLY this wood tone)
• Metal Accents: [e.g., "Brushed nickel"] (use ONLY this metal finish)

DECOR ELEMENTS:
• Wall Decor: 1-2 pieces of art, not overcrowded
• Rug: Matches color palette, appropriate size
• Windows: Simple treatments or bare
• Plants: 1-2 medium-sized plants
• Accents: Minimal, purposeful

🎨 PATTERN MIXING RULES:
• Maximum 3 patterns in room
• Vary scale: One large, one medium, one small
• Share at least one color across all patterns
```

### 6. LAYER 5: TECHNICAL REFINEMENT

```
==============================================
LAYER 5: TECHNICAL REFINEMENT
==============================================

LIGHTING ANALYSIS:
• Source: Natural light from [X] window(s)
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

⚖️ PHYSICS & REALISM:

GRAVITY:
• All furniture must appear grounded (not floating)
• Heavy items (beds, dressers) sit firmly on floor
• Contact shadows reinforce weight

MATERIALS:
• Fabrics drape naturally (curtains, throw blankets)
• Cushions show slight compression
• Rugs lie flat with realistic edges/corners
• Wood has natural grain and slight variations

LIGHTING BEHAVIOR:
• Surfaces facing light source are brighter
• Surfaces away from light are darker
• Reflective surfaces (glass, metal) show highlights
• Matte surfaces (fabric, wood) diffuse light
```

### 7. CUSTOM USER INSTRUCTIONS

```
==============================================
CUSTOM INSTRUCTIONS
==============================================

✨ USER REQUESTS:
[Whatever the user typed in custom additions field]
```

### 8. NEGATIVE PROMPTS

```
==============================================
NEGATIVE PROMPTS - WHAT NOT TO DO
==============================================

❌ NEVER:
• Change the room architecture, layout, or dimensions
• Modify walls, floors, ceilings, windows, or doors
• Create a different room than what's shown in the image
• Place furniture in doorways, archways, or passages
• Block windows with tall furniture
• Create furniture without contact shadows (floating appearance)
• Use oversized furniture (sofa >90"W, coffee table >48"W)
• Obstruct traffic flow paths
• Mix warm and cool wood tones in same room
• Exceed 3 patterns in decor
• Make furniture appear "pasted on" without proper shadows

❌ COMMON MISTAKES:
• Generating a completely different room → CRITICAL ERROR
• Changing wall colors or flooring → WRONG
• Moving windows or doors → WRONG
• Sofa directly blocking doorway → WRONG
• Furniture hovering without shadows → WRONG
• 9-foot sectional in 12-foot room → WRONG
• Coffee table higher than 20" → WRONG
• No clearance around dining table → WRONG
```

### 9. FINAL COMMAND

```
==============================================
GENERATION COMMAND
==============================================

Using the provided image, add professionally staged furniture and decor to this [ROOM_TYPE], following ALL 5 layers above.

🔒 ABSOLUTE RULE: Preserve the exact room architecture, walls, floors, windows, doors, and lighting from the original image. Only add furniture and decor - do not regenerate the room.

PRIORITY ORDER:
1. PRESERVE ORIGINAL ROOM (Most Important) - Keep all architectural features exactly as shown
2. LAYER 1 (Spatial Foundation) - ABSOLUTE constraints, cannot be violated
3. LAYER 2 (Dimensions) - Exact furniture sizes
4. LAYER 3 (Functional Zones) - Proper layout
5. LAYER 4 (Style) - Consistent design language
6. LAYER 5 (Technical) - Realistic shadows and physics

CRITICAL REQUIREMENTS:
✓ Room architecture matches original image exactly
✓ All doorways have 36" clearance
✓ All furniture has contact shadows
✓ Furniture sizes match specifications
✓ Traffic paths are clear
✓ Style is consistent throughout
✓ Everything looks naturally integrated (not pasted)

Edit the provided image now by adding furniture and decor while preserving the original room structure.
```

---

## Example API Call Structure

```typescript
// 1. Model selection
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image'
});

// 2. Prepare image
const imageBase64 = await dataUrlToBase64(imageDataUrl);
const mimeType = 'image/jpeg'; // or 'image/png'

// 3. Build complete prompt (all layers combined)
const fullPrompt = `
  [IMAGE EDITING INSTRUCTION]
  +
  [LAYER 1: SPATIAL FOUNDATION]
  +
  [LAYER 2: DIMENSIONS]
  +
  [LAYER 3: FUNCTIONAL ZONES]
  +
  [LAYER 4: STYLE]
  +
  [LAYER 5: TECHNICAL]
  +
  [CUSTOM INSTRUCTIONS]
  +
  [NEGATIVE PROMPTS]
  +
  [FINAL COMMAND]
`;

// 4. Make API call
const result = await model.generateContent({
  contents: [
    {
      role: 'user',
      parts: [
        { text: fullPrompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

// 5. Extract response
const response = await result.response;
const candidates = response.candidates;
const imagePart = candidates[0].content.parts.find(part => part.inlineData);
const generatedImageBase64 = imagePart.inlineData.data;
```

---

## Key Points for Testing in AI Studio

1. **Model**: `gemini-2.5-flash-image`

2. **Critical Config**:
   ```json
   {
     "responseModalities": ["TEXT", "IMAGE"]
   }
   ```
   Without this, you get text only!

3. **Input Format**:
   - Text prompt (all layers combined)
   - Base64-encoded image

4. **Top Priority Instructions**:
   - "IMAGE EDITING task - ADD furniture to existing room"
   - "PRESERVE room architecture EXACTLY"
   - "Do NOT generate new room"

---

## Testing Tips

To test in Google AI Studio:
1. Use `gemini-2.5-flash-image` model
2. Upload a room image
3. Copy the complete prompt structure above
4. Enable IMAGE output in response modalities
5. Check if it preserves the original room or generates new one

If it's generating new rooms instead of editing:
- Emphasize the IMAGE EDITING instruction more
- Add more PRESERVATION requirements
- Increase negative prompts about not changing architecture
