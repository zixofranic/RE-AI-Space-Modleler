# Gemini 2.5 Flash Image API Control Strategy
## Comprehensive Rule-Based System for Interior Design Automation

This document outlines the hierarchical rule structure for controlling Gemini's image generation API specifically for virtual staging and interior design applications.

---

## 1. Spatial Foundation Rules (Layer 1 - HIGHEST PRIORITY)

### Primary Structural Elements
These rules CANNOT be violated - they preserve architectural integrity:

```typescript
const spatialFoundationRules = {
  "preserve_architecture": {
    priority: "CRITICAL",
    rules: [
      "Identify and preserve all architectural boundaries (walls, ceiling, floor)",
      "Map ALL openings with precise locations (doors, windows, archways, passages)",
      "Define traffic pathways and circulation zones",
      "Establish structural elements (columns, beams, built-ins, fireplaces)",
      "Detect and preserve electrical outlets, switches, vents"
    ],
    enforcement: "HARD_CONSTRAINT"
  },

  "door_analysis": {
    detect: ["Door type (hinged, sliding, pocket, French)", "Swing direction", "Handle position"],
    preserve: ["36-inch minimum clearance in front of door", "Full swing arc if hinged", "Door frame and trim"],
    forbid: ["Furniture placement within swing arc", "Visual obstruction of door"]
  },

  "window_analysis": {
    detect: ["Window type (casement, double-hung, picture, bay)", "Window height and width", "Sill height"],
    preserve: ["Natural light pathways", "View corridors", "Window treatments clearance"],
    forbid: ["Furniture blocking windows", "Obstruction of opening mechanisms"]
  },

  "circulation_zones": {
    primary_pathways: {
      width: "36-48 inches minimum",
      clearance: "No furniture intrusion",
      examples: ["Entry to main living area", "Kitchen triangle", "Hallway passages"]
    },
    secondary_pathways: {
      width: "24-30 inches minimum",
      examples: ["Between furniture pieces", "Around bed sides"]
    }
  }
};
```

### Prompt Template for Spatial Foundation:
```
STAGE 1: SPATIAL ANALYSIS

Analyze this {{roomType}} image and identify:

🚪 DOORS & OPENINGS:
- Count: [number]
- Locations: [wall positions]
- Types: [hinged/sliding/etc]
- Swing directions: [left/right/inward/outward]
- CRITICAL: Mark 36" clearance zone in front of each door

🪟 WINDOWS:
- Count: [number]
- Locations: [wall positions]
- Dimensions: [width × height]
- Sill heights: [distance from floor]
- CRITICAL: Preserve sightlines and light paths

🚶 TRAFFIC FLOW:
- Primary pathways: [entry → focal point → exits]
- Width requirements: 36-48" for main, 24-30" for secondary
- CRITICAL: These zones must remain completely clear

🏗️ STRUCTURAL ELEMENTS:
- Columns, beams, built-ins
- Fireplaces, mantels
- Electrical outlets, switches
- HVAC vents, radiators

OUTPUT: Generate a constraint map showing:
- RED zones = FORBIDDEN (no furniture allowed)
- YELLOW zones = CAUTION (limited furniture with clearance)
- GREEN zones = SAFE (furniture placement allowed)
```

---

## 2. Dimensional & Scale Rules (Layer 2)

### Furniture Sizing Standards
```typescript
const furnitureDimensions = {
  "living_room": {
    sofa: {
      standard: "84\"W × 36\"D × 32\"H",
      max_width: "90\"",
      loveseat: "58\"W × 36\"D",
      sectional: "Varies, but no single section > 90\"W"
    },
    coffee_table: {
      standard: "48\"W × 24\"D × 18\"H",
      rule: "Should be 2/3 length of sofa",
      clearance: "18\" from sofa edge"
    },
    side_table: {
      standard: "22\"W × 22\"D × 24\"H",
      rule: "Height should match sofa arm (±2\")"
    },
    media_console: {
      width: "Based on TV size (TV width + 10-20\")",
      height: "20-26\"",
      rule: "TV center should be at seated eye level (40-48\" from floor)"
    },
    area_rug: {
      sizes: ["5'×7'", "8'×10'", "9'×12'"],
      rule: "Front legs of furniture ON rug, or all legs ON rug"
    }
  },

  "bedroom": {
    bed: {
      twin: "39\"W × 75\"L",
      full: "54\"W × 75\"L",
      queen: "60\"W × 80\"L",
      king: "76\"W × 80\"L",
      clearance: {
        sides: "24\" minimum (30\" preferred)",
        foot: "36\" minimum"
      }
    },
    nightstand: {
      standard: "24\"W × 18\"D × 24-28\"H",
      rule: "Height should align with mattress top (±4\")"
    },
    dresser: {
      standard: "60\"W × 18\"D × 32\"H",
      clearance: "36\" in front for drawer opening"
    }
  },

  "dining_room": {
    table: {
      round: {
        "4_person": "36-44\" diameter",
        "6_person": "48-60\" diameter"
      },
      rectangular: {
        "4_person": "36\"W × 48\"L",
        "6_person": "36\"W × 72\"L",
        "8_person": "40\"W × 84\"L"
      },
      clearance: "36-42\" from table edge to wall/furniture"
    },
    chair: {
      standard: "18-20\"W × 18\"D × 36\"H total (18\" seat height)",
      spacing: "24\" between chair centers"
    }
  }
};
```

### Proportional Relationships
```typescript
const proportionRules = {
  "furniture_to_room": {
    rule: "Furniture should occupy 50-60% of floor space",
    example: "12'×15' room (180 sq ft) → ~100 sq ft furniture footprint"
  },

  "art_to_furniture": {
    wall_art: "Width should be 2/3 to 3/4 of furniture width below",
    hanging_height: "Center at 57-60\" (eye level)",
    above_sofa: "6-12\" above sofa back"
  },

  "lighting_to_table": {
    chandelier: "Diameter = table width ÷ 2 (or room width + length in feet = diameter in inches)",
    hanging_height: "30-36\" above table surface"
  }
};
```

---

## 3. Functional Zoning Rules (Layer 3)

### Space Planning by Room Type

```typescript
const functionalZones = {
  "living_room": {
    conversation_zone: {
      seating_distance: "7-10 feet max between seats",
      arrangement: "U-shape or L-shape facing focal point",
      focal_point: "TV, fireplace, or window view"
    },
    traffic_zone: {
      maintain: "Clear paths around seating group",
      avoid: "Walking between TV and seating"
    },
    activity_layers: {
      primary: "Conversation/TV viewing",
      secondary: "Reading nook, workspace",
      accent: "Plants, decorative elements"
    }
  },

  "bedroom": {
    sleep_zone: {
      bed_placement: "Headboard against solid wall (not under window)",
      symmetry: "Matching nightstands preferred",
      sight_line: "View to door from bed (security)"
    },
    dressing_zone: {
      dresser_location: "Not blocking closet or windows",
      mirror_placement: "Natural light preferred"
    },
    optional_zones: {
      reading_nook: "Corner chair + floor lamp",
      workspace: "Desk facing window or wall"
    }
  },

  "kitchen": {
    work_triangle: {
      definition: "Sink ↔ Stove ↔ Refrigerator",
      total_distance: "12-26 feet ideal",
      rule: "No leg > 9 feet, no leg < 4 feet"
    },
    landing_zones: {
      refrigerator: "15\" on handle side",
      range: "15\" on both sides",
      sink: "24\" on one side, 18\" on other"
    }
  }
};
```

---

## 4. Style Consistency Rules (Layer 4)

### Design Language Control

```typescript
const styleRules = {
  "modern_minimalist": {
    furniture_style: "Clean lines, low profiles, minimal ornamentation",
    color_palette: "Neutral base (white, gray, black) + 1-2 accent colors",
    materials: "Glass, metal, leather, lacquer",
    forbidden: ["Ornate carvings", "Floral patterns", "Heavy drapery"],
    lighting: "Recessed, track, or geometric pendants"
  },

  "traditional": {
    furniture_style: "Curved lines, carved details, tufted upholstery",
    color_palette: "Warm neutrals (beige, cream, brown) + rich accents",
    materials: "Wood (mahogany, cherry), fabric, brass",
    required: ["Crown molding consideration", "Symmetrical arrangements"],
    lighting: "Chandeliers, table lamps with shades"
  },

  "scandinavian": {
    furniture_style: "Simple forms, organic shapes, functional",
    color_palette: "White/light gray base + natural wood + one color (often blue or yellow)",
    materials: "Light woods (birch, pine), wool, linen",
    elements: ["Hygge lighting (candles, soft lamps)", "Plants", "Textured textiles"],
    lighting: "Pendant lamps, floor lamps with warm glow"
  },

  "transitional": {
    definition: "Blend of traditional and contemporary",
    balance: "50/50 or 60/40 split",
    furniture: "Classic silhouettes with clean lines",
    color: "Neutral foundation with versatile accents",
    rule: "Avoid extremes of either style"
  }
};

const colorTheory = {
  "60_30_10_rule": {
    dominant: "60% - Main wall color, large furniture",
    secondary: "30% - Upholstery, curtains, area rug",
    accent: "10% - Pillows, art, accessories"
  },

  "color_temperature": {
    warm: "Red, orange, yellow undertones - cozy, intimate",
    cool: "Blue, green, purple undertones - calm, spacious",
    rule: "Don't mix warm and cool woods in same room"
  },

  "pattern_mixing": {
    max_patterns: 3,
    scale_variance: "One large-scale, one medium, one small",
    color_unifier: "Share at least one color across all patterns"
  }
};
```

---

## 5. Technical Constraint Rules (Layer 5)

### Building Codes & Physics

```typescript
const technicalConstraints = {
  "egress_requirements": {
    bedroom_window: {
      min_opening_height: "24 inches",
      min_opening_width: "20 inches",
      min_opening_area: "5.7 square feet",
      max_sill_height: "44 inches from floor"
    },
    door_width: {
      exterior: "36 inches minimum",
      interior: "32 inches minimum (28\" for bathrooms)",
      bedroom: "32 inches minimum"
    }
  },

  "ada_compliance": {
    wheelchair_turning: "60-inch diameter clear space",
    door_clearance: "32 inches minimum when open 90°",
    counter_height: "34 inches maximum (29-34\" range)"
  },

  "lighting_physics": {
    shadow_direction: {
      detect: "Analyze existing shadows in room",
      rule: "All added elements must match light source angle",
      types: ["Contact shadow (object base)", "Cast shadow (extends from object)", "Form shadow (object's dark side)"]
    },
    natural_light: {
      intensity: "Brightest near windows, gradient to interior",
      color_temperature: "Cooler (blue-white) near windows, warmer interior"
    },
    artificial_light: {
      layers: ["Ambient (general)", "Task (functional)", "Accent (highlight)"],
      rule: "Multiple light sources at different heights"
    }
  },

  "gravity_and_physics": {
    contact_points: "All furniture must have visible contact shadow with floor",
    weight_distribution: "Heavy items appear grounded, light items can 'float' slightly",
    material_behavior: "Fabrics drape, cushions compress, rugs lie flat"
  }
};
```

---

## Implementation Framework

### Layered Prompt Structure

```typescript
const generateStagingPrompt = (roomAnalysis, userPreferences) => `
==============================================
LAYER 1: SPATIAL FOUNDATION (HIGHEST PRIORITY)
==============================================

ROOM: ${roomAnalysis.roomType}
DIMENSIONS: ${roomAnalysis.dimensions.width}' × ${roomAnalysis.dimensions.height}'

🚨 CRITICAL CONSTRAINTS - ABSOLUTE RULES:

DOORS:
${roomAnalysis.doors.map(door => `
- ${door.location}: ${door.type} door, swings ${door.direction}
  → FORBIDDEN ZONE: ${door.clearanceArea}
  → RULE: No furniture within 36" clearance
`).join('\n')}

WINDOWS:
${roomAnalysis.windows.map(window => `
- ${window.location}: ${window.width}" wide, sill at ${window.sillHeight}"
  → PRESERVE: Sightlines and natural light path
  → RULE: No tall furniture blocking window
`).join('\n')}

TRAFFIC FLOW:
${roomAnalysis.pathways.map(path => `
- ${path.from} → ${path.to}: ${path.width}" width required
  → RULE: This zone must remain completely clear
`).join('\n')}

==============================================
LAYER 2: DIMENSIONAL CONSTRAINTS
==============================================

FURNITURE SIZING:
${getFurnitureSizing(roomAnalysis.roomType)}

PROPORTIONS:
- Room area: ${roomAnalysis.area} sq ft
- Max furniture footprint: ${roomAnalysis.area * 0.6} sq ft
- Clearances: 36" walkways, 18" between furniture

==============================================
LAYER 3: FUNCTIONAL LAYOUT
==============================================

${getFunctionalZones(roomAnalysis.roomType, userPreferences)}

==============================================
LAYER 4: STYLE APPLICATION
==============================================

DESIGN STYLE: ${userPreferences.style}
${getStyleGuidelines(userPreferences.style)}

COLOR SCHEME: ${userPreferences.colorPalette}
${getColorRules(userPreferences.colorPalette)}

==============================================
LAYER 5: TECHNICAL REFINEMENT
==============================================

LIGHTING & SHADOWS:
- Light source: ${roomAnalysis.lightSource}
- Shadow direction: ${roomAnalysis.shadowAngle}°
- RULE: All furniture must have:
  1. Contact shadow (dark line at base touching floor)
  2. Cast shadow (extending away from light)
  3. Form shadow (darker side away from light)

PHYSICS:
- All furniture must appear grounded (not floating)
- Fabrics drape naturally
- Cushions show compression
- Rugs lie flat with realistic edges

==============================================
NEGATIVE PROMPTS (WHAT NOT TO DO)
==============================================

❌ NEVER:
- Place furniture in red forbidden zones
- Block doorways or windows
- Create floating furniture without shadows
- Use oversized furniture (sofa > 90"W)
- Mix warm and cool wood tones
- Exceed 3 patterns
- Violate traffic flow paths

❌ COMMON MISTAKES TO AVOID:
${getNegativeExamples(roomAnalysis.roomType)}

==============================================
VALIDATION CHECKLIST
==============================================

Before finalizing, verify:
✓ All doors have 36" clearance
✓ Windows are not blocked
✓ Traffic paths are clear
✓ Furniture has proper shadows
✓ Furniture sizes are realistic
✓ Style is consistent throughout
✓ Color scheme follows 60-30-10 rule
✓ No elements appear to float

==============================================
GENERATION COMMAND
==============================================

Generate a photorealistic ${roomAnalysis.roomType} following ALL rules above.
Prioritize Layer 1 (Spatial Foundation) as ABSOLUTE constraints.
Apply Layers 2-5 in order, adjusting for conflicts.

${userPreferences.customAdditions ? `
CUSTOM REQUESTS:
${userPreferences.customAdditions}
` : ''}
`;
```

---

## Validation & Feedback Loop

```typescript
const validationSystem = {
  "spatial_validation": {
    check: "doors_clear",
    test: (result) => "Are all doorways and traffic paths completely clear?",
    action_if_failed: "Regenerate with stronger door clearance emphasis"
  },

  "dimensional_validation": {
    check: "furniture_scale",
    test: (result) => "Is furniture appropriately sized for the room?",
    action_if_failed: "Add explicit dimensions to prompt"
  },

  "style_validation": {
    check: "consistency",
    test: (result) => "Do all elements match the selected style?",
    action_if_failed: "Strengthen style keywords, add negative prompts for conflicting styles"
  },

  "technical_validation": {
    check: "shadows_present",
    test: (result) => "Does all furniture have visible contact shadows?",
    action_if_failed: "Add shadow physics rules to prompt, increase shadow emphasis"
  }
};

const feedbackLoop = {
  iteration_1: "Generate with full layered prompt",
  if_violation: {
    identify: "Which layer was violated?",
    adjust: {
      layer_1: "Increase weight of spatial rules, add explicit forbidden zones",
      layer_2: "Add specific measurements to furniture descriptions",
      layer_3: "Clarify functional zone requirements",
      layer_4: "Strengthen style keywords, add more negative prompts",
      layer_5: "Add explicit physics instructions"
    },
    iteration_2: "Regenerate with adjusted prompt",
    max_iterations: 3
  }
};
```

---

## Integration with Current System

### Update `app/api/generate-staging/route.ts`:

1. **Replace current simple prompt** with layered prompt structure
2. **Add room analysis parsing** (already have from Gemini Vision analysis)
3. **Apply dimensional rules** based on room type
4. **Integrate user preferences** (already collecting from ExpertMode)
5. **Generate validation checklist** automatically

### Benefits:

- **Hierarchical enforcement**: Critical rules (doors/windows) enforced first
- **Explicit constraints**: Furniture dimensions prevent oversizing
- **Physics-based shadows**: Clear shadow requirements
- **Style consistency**: Systematic color and pattern rules
- **Validation built-in**: Checklist generated from rules

---

This comprehensive rule-based system gives you precise control over Gemini 2.5 Flash Image generation while maintaining creative flexibility within defined boundaries.
