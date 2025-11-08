# 🏗️ Implementation Plan - Version History & Property Management

## Feature 1: Multi-Version Editing with Persistence

### User Story
```
As a user, I want to:
1. Edit an image multiple times (version 1 → 2 → 3)
2. Leave and work on other images
3. Return to any previous image
4. Continue editing from the last version (create version 4, 5, etc.)
```

### Current State
- ✅ Multiple versions stored in localStorage (`stagingResults: Record<string, StagingResult[]>`)
- ✅ Versions saved to database
- ❌ Can't return to old projects and continue editing
- ❌ No version history view in project details

### Implementation Plan

#### Step 1: Project Detail Page with Version History

**File:** `app/project/[id]/page.tsx` (new file)

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ ← Back to Projects                      │
│                                          │
│ Property: 123 Main Street               │
│ Last updated: Jan 15, 2025              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Images in this Property (3)             │
├─────────────────────────────────────────┤
│                                          │
│ 📷 Bedroom (Original)                   │
│ ┌──────┬──────┬──────┐                 │
│ │ V1   │ V2   │ V3   │                 │
│ │[img] │[img] │[img] │                 │
│ │Edit  │Edit  │Edit  │                 │
│ └──────┴──────┴──────┘                 │
│ [+ Continue Editing] [Download All]     │
│                                          │
│ 📷 Living Room (Original)               │
│ ┌──────┬──────┐                        │
│ │ V1   │ V2   │                        │
│ │[img] │[img] │                        │
│ │Edit  │Edit  │                        │
│ └──────┴──────┘                        │
│ [+ Continue Editing] [Download All]     │
│                                          │
│ 📷 Kitchen (Original)                   │
│ ┌──────┐                               │
│ │ V1   │                               │
│ │[img] │                               │
│ │Edit  │                               │
│ └──────┘                               │
│ [+ Continue Editing] [Download All]     │
└─────────────────────────────────────────┘
```

**Data Flow:**
```typescript
1. Load project by ID
   ↓
2. Query database for all images in project
   ↓
3. For each image, query all staging_results
   ↓
4. Display version history for each image
```

#### Step 2: "Continue Editing" Functionality

**When user clicks "Continue Editing" on an image:**

```typescript
async function continueEditing(imageId: string, projectId: string) {
  // 1. Load project data from database
  const project = await getProject(projectId);
  const image = await getImage(imageId);
  const versions = await getStagingResults(imageId);

  // 2. Populate store with project data
  setProjectId(projectId);
  setUploadedImages([image]);
  setStagingResults({ [imageId]: versions });

  // 3. Navigate to results view (ready to edit)
  setStep('results');
  router.push('/');
}
```

**Store Updates Needed:**
```typescript
// New actions in store
interface AppState {
  // ... existing state

  // NEW: Load project from database
  loadProject: (projectId: string) => Promise<void>;

  // NEW: Clear current project (when starting fresh)
  clearProject: () => void;
}
```

#### Step 3: Edit Button on Each Version

**Functionality:**
- Click "Edit" on Version 2
- Loads Version 2 as the base image
- User makes changes
- Creates Version 4 (next in sequence)

**Implementation:**
```typescript
async function editVersion(imageId: string, versionIndex: number) {
  const version = stagingResults[imageId][versionIndex];

  // Use this version's staged image as the new base
  const baseImage = version.stagedImageUrl;

  // Open edit modal with this image
  setEditingImage({
    imageId,
    baseImageUrl: baseImage,
    currentVersionCount: stagingResults[imageId].length
  });
}
```

---

## Feature 2: Property/Project Management

### User Story
```
As a user, I want to:
1. Name my properties (e.g., "123 Main Street", "Beach House")
2. When uploading new images, choose:
   - Create new property
   - Add to existing property
3. See all images grouped by property in "My Projects"
```

### Current State
- ❌ Auto-generated project names ("Project 1/15/2025")
- ❌ Can't add images to existing projects
- ❌ Each upload creates new project

### Implementation Plan

#### Step 1: Property Selection Modal

**File:** `components/upload/PropertySelector.tsx` (new file)

**UI Layout:**
```
┌──────────────────────────────────────────┐
│ Select Property                    ✕     │
├──────────────────────────────────────────┤
│                                           │
│ ⭕ Create New Property                   │
│    Property Name: [_________________]    │
│    Address: [_______________________]    │
│                                           │
│ ⭕ Add to Existing Property              │
│    [Select Property ▼                 ]  │
│    ┌─────────────────────────────────┐  │
│    │ 🏠 123 Main Street (5 images)   │  │
│    │ 🏠 Beach House (3 images)       │  │
│    │ 🏠 Downtown Condo (8 images)    │  │
│    └─────────────────────────────────┘  │
│                                           │
│           [Cancel]  [Continue]            │
└──────────────────────────────────────────┘
```

**When it appears:**
- Shown BEFORE the image uploader
- Or as a step in the upload flow
- User must select/create property before uploading

#### Step 2: Database Schema Update

**Current `projects` table:**
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  settings JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Updated `projects` table:**
```sql
ALTER TABLE projects ADD COLUMN address TEXT;
ALTER TABLE projects ADD COLUMN property_type TEXT; -- 'house', 'condo', 'apartment'
ALTER TABLE projects ADD COLUMN notes TEXT;

-- Example data:
{
  id: 'project-123',
  name: '123 Main Street',
  address: '123 Main St, San Francisco, CA 94102',
  property_type: 'house',
  notes: 'Single family, 3BR/2BA',
  ...
}
```

#### Step 3: Upload Flow Changes

**New Flow:**

```
Step 0: Property Selection (NEW)
├─ Create new property → Enter name & address
└─ Add to existing → Select from dropdown

Step 1: Upload Images
├─ Images tagged with selected projectId
└─ All images go to same property

Step 2-5: (unchanged)
```

**Store Changes:**
```typescript
interface AppState {
  // NEW: Current property info
  currentProperty: {
    id: string;
    name: string;
    address?: string;
    isNew: boolean;
  } | null;

  // NEW: Available properties for selection
  availableProperties: Array<{
    id: string;
    name: string;
    address?: string;
    imageCount: number;
  }>;

  // NEW: Actions
  setCurrentProperty: (property: { id: string; name: string; address?: string }) => void;
  loadAvailableProperties: () => Promise<void>;
}
```

#### Step 4: My Projects View Update

**Updated UI:**

```
┌─────────────────────────────────────────┐
│ My Projects                              │
├─────────────────────────────────────────┤
│                                          │
│ 🏠 123 Main Street                      │
│    123 Main St, San Francisco, CA        │
│    5 images • Last updated: 2 days ago   │
│    [View Property →]                     │
│                                          │
│ 🏠 Beach House                          │
│    456 Ocean Ave, Malibu, CA             │
│    3 images • Last updated: 1 week ago   │
│    [View Property →]                     │
│                                          │
│ 🏠 Downtown Condo                       │
│    789 Market St, SF, CA                 │
│    8 images • Last updated: 3 days ago   │
│    [View Property →]                     │
└─────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 1: Property Management (Foundation)
1. ✅ Create PropertySelector component
2. ✅ Update database schema (add address, property_type)
3. ✅ Add property selection to upload flow
4. ✅ Update "My Projects" to show property info
5. ✅ Test: Create property, add multiple images

### Phase 2: Version History View
1. ✅ Create `/project/[id]` detail page
2. ✅ Query all images and staging results for a project
3. ✅ Display version history for each image
4. ✅ Add download buttons for individual versions
5. ✅ Test: View project with multiple images and versions

### Phase 3: Continue Editing
1. ✅ Add `loadProject()` action to store
2. ✅ Implement "Continue Editing" button
3. ✅ Load project data into store
4. ✅ Navigate to results view
5. ✅ Test: Edit → Leave → Return → Continue editing

### Phase 4: Edit Specific Versions
1. ✅ Add "Edit" button to each version thumbnail
2. ✅ Load specific version as base image
3. ✅ Create new version in sequence
4. ✅ Test: Edit V2 → Creates V4

---

## Data Flow Diagrams

### Current Flow (Simple)
```
Upload → Auto-create project → Generate V1 → Done
```

### New Flow (Property Management)
```
Select Property
├─ New: Enter name → Create project
└─ Existing: Select → Use existing projectId
    ↓
Upload images → Tag with projectId
    ↓
Generate V1, V2, V3
    ↓
Save all to database
    ↓
Later: Load project → Continue editing → V4, V5
```

### Version History Flow
```
User at "My Projects"
    ↓
Click "123 Main Street"
    ↓
See all images in property:
  - Bedroom: V1, V2, V3
  - Living Room: V1, V2
  - Kitchen: V1
    ↓
Click "Continue Editing" on Bedroom
    ↓
Load Bedroom + all versions into store
    ↓
User sees V3, edits it → V4
    ↓
Save V4 to database
    ↓
Return to projects → Now shows V1, V2, V3, V4
```

---

## Questions Before Implementation

### 1. Property Selection UX
**Option A:** Modal before upload
**Option B:** Inline selector at top of upload page
**Option C:** Dedicated "New Property" page, then upload

**Recommendation:** Option B (inline selector) - less disruptive, always visible

### 2. Property Naming
**Option A:** Required name + optional address
**Option B:** Either name OR address required
**Option C:** Auto-generate from first image address (if available)

**Recommendation:** Option A - name required, address optional but helpful

### 3. Version Editing UX
**Option A:** "Edit" button on each version (creates new version)
**Option B:** "Continue" button on last version only
**Option C:** Both - "Edit" any version, "Continue" on latest

**Recommendation:** Option C - maximum flexibility

### 4. Default Property Name
**Current:** "Project 1/15/2025"
**Option A:** Require user to name before upload
**Option B:** Default to "Untitled Property" + allow rename later
**Option C:** Default to "Property [address]" if we can detect address

**Recommendation:** Option B - don't block upload flow, allow rename

### 5. Database Migration
Do we need to migrate existing projects to have names/addresses?
**Option A:** Leave old projects as-is
**Option B:** Update old projects with default name "Untitled Property"

**Recommendation:** Option B - consistent data model

---

## File Structure

### New Files to Create:
```
components/upload/PropertySelector.tsx    - Property selection UI
components/property/PropertyCard.tsx      - Enhanced project card
app/project/[id]/page.tsx                 - Project detail page
lib/property.ts                           - Property management utilities
```

### Files to Modify:
```
app/page.tsx                              - Add property selector
app/projects/page.tsx                     - Show property names
lib/store.ts                              - Add property management state
lib/database.ts                           - Update project queries
types/index.ts                            - Add property types
```

---

## Next Steps

**Please confirm:**
1. ✅ Do you approve this overall approach?
2. ✅ Which UX options do you prefer? (Questions 1-5 above)
3. ✅ Should I start with Phase 1 (Property Management)?

Once approved, I'll start implementing phase by phase, testing each before moving to the next.
