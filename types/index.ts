// Maximum number of versions per image
export const MAX_VERSIONS_PER_IMAGE = 4;

// =============================================
// CORE TYPES
// =============================================

export interface UploadedImage {
  id: string;
  file: File | null;
  dataUrl: string;
  name: string;
}

export interface RoomAnalysis {
  imageId: string;
  projectId?: string;
  roomType: string;
  confidence?: number;
  features: string[];
  dimensions?: any;
  lighting?: string;
  flooring?: string;
  windows?: number;
  suggestedPreset?: string;
  spatialInfo?: {
    estimatedDimensions?: { width?: number; length?: number; height?: number };
    viewpoint?: string;
    naturalLight?: string;
  };
  // Advanced analysis fields
  detailedLighting?: {
    naturalLightDirection?: string;
    existingFixtures?: string[];
    overallQuality?: string;
  };
  wallInfo?: {
    color?: string;
    finish?: string;
    condition?: string;
  };
  connections?: {
    likelyConnectedRooms?: string[];
    openFloorPlan?: boolean;
  };
  spatialFingerprint?: string;
  signatureFeatures?: string[];
  spatialNotes?: string;
}

export interface RoomGroup {
  id: string;
  imageIds: string[];
  roomType: string;
  primaryImageId: string;
}

export interface RoomStagingConfig {
  roomId: string;
  mode?: DesignMode;
  preset?: string;
  settings?: DesignSettings;
  useLayeredGeneration?: boolean;
  seed?: number;
}

export interface DesignSettings {
  designStyle?: string;
  colorPalette?: string;
  furniture?: string;
  customAdditions?: string;
  woodFinish?: string;
  metalAccents?: string;
  furnitureStyle?: string;
  rugStyle?: string;
  greenery?: string;
  atmosphere?: string;
  flooring?: string;
  wallDecor?: string;
  windowTreatments?: string;
  accents?: string;
  // Expert mode additional fields
  seating?: string;
  storage?: string;
  texture?: string;
  lighting?: string;
  consistency?: string;
  pricePoint?: string;
  customPromptOverride?: string;
}

export interface LayerResult {
  layerNumber: number;
  layerName: string;
  imageUrl: string;
  metadata?: any;
  success: boolean;
  error?: string;
}

export interface StagingResult {
  imageId: string;
  roomType: string;
  description: string;
  suggestions: string;
  stagedImageUrl: string;
  details?: any;
  layers?: LayerResult[];
  isLayered?: boolean;
}

export type DesignMode = 'preset' | 'guided' | 'expert';

export interface PresetStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: DesignSettings;
}

export interface Property {
  id: string;
  name: string;
  address?: string;
  property_type?: string;
  created_at?: string;
  updated_at?: string;
  imageCount?: number;
  isNew?: boolean;
}

export interface ProjectStyleGuide {
  primaryWood: string;
  secondaryWood?: string;
  primaryMetal: string;
  accentMetal?: string;
  primaryFabric: string;
  accentFabric?: string;
  rugPattern?: string;
  greeneryType?: string;
  extractedFrom?: string;
  timestamp?: string;
}

// =============================================
// APP STATE
// =============================================

export interface AppState {
  // Project management
  currentProperty: Property | null;
  availableProperties: Property[];
  projectId?: string;
  projectStyleGuide?: ProjectStyleGuide;

  // Navigation
  currentStep: 'upload' | 'mode' | 'customize' | 'generate' | 'results';

  // Image data
  uploadedImages: UploadedImage[];
  roomAnalyses: Record<string, RoomAnalysis>;
  roomGroups: RoomGroup[];

  // Configuration
  selectedMode?: DesignMode;
  selectedPreset?: string;
  selectedRoomId?: string;
  roomConfigs: Record<string, RoomStagingConfig>;

  // Results (array of versions per image)
  stagingResults: Record<string, StagingResult[]>;

  // UI state
  isProcessing: boolean;
  error?: string;
}

// =============================================
// SPATIAL ANALYSIS TYPES
// =============================================

export interface RoomStagingResult {
  roomType: string;
  furniture: Array<{ type: string; position: string }>;
  lighting: string;
  colorScheme: string;
  description: string;
}
