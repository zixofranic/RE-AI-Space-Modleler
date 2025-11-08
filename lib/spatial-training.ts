/**
 * Few-shot learning examples for better spatial understanding
 */

export const SPATIAL_TRAINING_EXAMPLES = [
  {
    description: "Empty living room with bay window",
    analysis: {
      roomType: "Living Room",
      dimensions: {
        estimated: "medium-large",
        ceilingHeight: "standard",
        squareFootage: "250-300"
      },
      features: [
        "bay window with 3 panels",
        "hardwood flooring",
        "crown molding",
        "recessed lighting (4 fixtures)"
      ],
      lighting: "south-facing natural light through bay window, supplemented by recessed ceiling lights",
      flooring: "medium-tone hardwood, appears to be oak, good condition",
      windows: 3,
      walls: "neutral beige paint, smooth finish",
      architecturalDetails: ["crown molding", "baseboards", "window trim"],
      spatialNotes: "Open floor plan, likely connects to dining area based on sight lines"
    }
  },
  {
    description: "Empty master bedroom with ensuite door visible",
    analysis: {
      roomType: "Master Bedroom",
      dimensions: {
        estimated: "large",
        ceilingHeight: "standard",
        squareFootage: "180-220"
      },
      features: [
        "ensuite bathroom door",
        "carpet flooring",
        "large window",
        "walk-in closet door"
      ],
      lighting: "east-facing window (morning light), overhead ceiling fixture",
      flooring: "plush carpet, light beige/cream color",
      windows: 1,
      walls: "white/off-white paint",
      architecturalDetails: ["door frame", "window frame"],
      spatialNotes: "Rectangular room, door placement suggests hallway connection on right side"
    }
  },
  {
    description: "Empty kitchen with island space",
    analysis: {
      roomType: "Kitchen",
      dimensions: {
        estimated: "medium",
        ceilingHeight: "standard",
        squareFootage: "150-180"
      },
      features: [
        "kitchen island outline visible",
        "tile flooring",
        "pendant light fixtures",
        "window above sink area"
      ],
      lighting: "north-facing window, under-cabinet lighting, pendant lights over island",
      flooring: "ceramic or porcelain tile, light color",
      windows: 1,
      walls: "likely white/off-white",
      architecturalDetails: ["cabinet outlines", "countertop edges visible"],
      spatialNotes: "Galley or L-shaped layout, island suggests open-concept connection to living area"
    }
  }
];

/**
 * Generates an enhanced prompt with few-shot examples
 */
export function buildSpatialAnalysisPrompt(): string {
  const examples = SPATIAL_TRAINING_EXAMPLES.map((example, i) => `
EXAMPLE ${i + 1}:
Image: ${example.description}
Correct Analysis:
${JSON.stringify(example.analysis, null, 2)}
`).join('\n');

  return `You are an expert at analyzing real estate photography with architectural knowledge.

${examples}

Now analyze the provided image using the same detailed approach. Pay special attention to:
1. **Spatial relationships** - What's visible beyond this room?
2. **Architectural clues** - Door placement, window orientation
3. **Lighting direction** - Which way does natural light come from?
4. **Scale indicators** - Use visible elements to estimate dimensions
5. **Material identification** - Exact flooring, wall, ceiling materials`;
}
