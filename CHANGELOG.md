# Changelog

All notable changes to the AI Virtual Staging project will be documented in this file.

## [Unreleased] - 2025-11-07

### Added
- Fixed download functionality to download staged images instead of originals
- Added industry-standard lightbox/image viewer with navigation
- Implemented image-to-image editing approach for preserving room architecture
- Added hover effects and "Click to view full size" overlay on staged images
- Implemented Gemini 2.0 Flash for room analysis via 20 questions game
- Implemented Gemini 2.5 Flash Image for virtual staging generation

### Changed
- Updated image generation to use image editing technique (passes original image + prompt)
- Modified prompts to explicitly preserve walls, floors, windows, ceiling, and lighting
- Stored staged results globally for proper download functionality

### Research & Planning
- Researched professional virtual staging workflows and multi-room consistency
- Identified industry-standard spatial awareness techniques:
  - Depth maps and 3D spatial reconstruction
  - Seed numbers for furniture consistency across multiple angles
  - Edge detection to prevent floating furniture
- Researched preset/ambiance systems in professional design tools

## [Planned] - Future Implementation

### New UX Workflow (To Be Implemented)
Based on research of professional tools (Pedra.ai, Virtual Staging AI, Spacely AI):

**STEP 1: Upload All Images First**
- Drag & drop multiple images at once
- AI analyzes spatial relationships between images
- AI detects same apartment/house and room types
- Shows thumbnail grid with auto-detected room types

**STEP 2: Choose Starting Point (Accessibility)**
Three modes for different user levels:
1. **PRESETS** (Beginner-friendly entry point)
   - 6 preset styles: Modern Minimal, Warm & Cozy, Luxe Elegant, Scandinavian Bright, Industrial Chic, Bohemian Eclectic
   - Presets as modifiable starting points (TBD: or locked templates)
   - One-click ambiance selection

2. **GUIDED MODE**
   - 10-20 questions per room
   - Customizable based on preset selection

3. **EXPERT MODE**
   - Full control over all parameters
   - Custom value inputs

**STEP 3: Per-Room Customization UI**
- Left sidebar: Image thumbnails (click to select room)
- Right panel:
  - Room-specific questions (10-20)
  - Custom additions bar for specific items (e.g., "fireplace mantel decor, vintage rug, plant in corner")
  - "Apply to all rooms" option for consistency
  - "Generate this room" button

**STEP 4: AI Generation with Spatial Awareness**
- System understands images are from same property
- Reuses same furniture across different angles of same room
- Maintains consistency: colors, style, wood tones across property
- Uses seed numbers for multi-view consistency

### Technical Features to Implement
1. **Spatial Awareness System**
   - Analyze all images together during upload
   - Detect which images show same room from different angles (auto-detect with manual override)
   - Group rooms by property
   - Identify room dimensions and architecture

2. **Furniture Consistency Engine**
   - Generate same furniture in multiple views of same room
   - Use seed number technique for consistency
   - Preserve furniture style across property

3. **Preset System**
   - 6 starting presets with predefined combinations
   - Modifiable parameters after preset selection
   - Save custom presets for reuse

4. **Per-Room Customization**
   - Dynamic question generation based on room type
   - Custom addition text input for specific requests
   - Batch apply settings across rooms

### Research Sources
- Pedra.ai: Multi-angle virtual staging with "Use furniture from another image"
- Virtual Staging AI: Multi-View Staging consistency
- Spacely AI: Preset system with Mode/Space/Room/Style selection
- Studio McGee: Professional preset workflows
- Industry standard: Depth analysis, edge detection, perspective-aware algorithms

### Design Decisions Made
1. Presets as starting points (modifiable) - TBD
2. Custom additions bar for free-text item requests - YES
3. Auto-detect multiple angles with manual grouping option - YES (auto with override)
4. 6 preset styles to start - YES

---

## [0.1.0] - 2025-11-07

### Initial Release
- Basic questionnaire system (20 design questions)
- Image upload with drag & drop
- Integration with Google Gemini AI
- Room analysis and staging generation
- Download functionality
- Responsive design
