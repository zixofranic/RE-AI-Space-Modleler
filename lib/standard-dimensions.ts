/**
 * Standard dimensions for common household items and architectural elements
 * Used for spatial calibration and room measurement estimation
 */

export interface DimensionStandard {
  name: string;
  category: 'appliance' | 'fixture' | 'architectural' | 'furniture';
  typical: {
    width: { min: number; max: number; standard: number }; // inches
    height: { min: number; max: number; standard: number }; // inches
    depth: { min: number; max: number; standard: number }; // inches
  };
  notes?: string;
}

export const STANDARD_DIMENSIONS: Record<string, DimensionStandard> = {
  // Kitchen Appliances
  refrigerator_standard: {
    name: 'Standard Refrigerator',
    category: 'appliance',
    typical: {
      width: { min: 30, max: 36, standard: 33 },
      height: { min: 66, max: 70, standard: 68 },
      depth: { min: 28, max: 34, standard: 30 }
    },
    notes: 'Most common residential refrigerator'
  },
  refrigerator_french_door: {
    name: 'French Door Refrigerator',
    category: 'appliance',
    typical: {
      width: { min: 32, max: 36, standard: 36 },
      height: { min: 68, max: 70, standard: 69 },
      depth: { min: 30, max: 36, standard: 33 }
    }
  },
  stove_range: {
    name: 'Standard Range/Stove',
    category: 'appliance',
    typical: {
      width: { min: 30, max: 30, standard: 30 },
      height: { min: 36, max: 36, standard: 36 },
      depth: { min: 25, max: 28, standard: 26 }
    },
    notes: 'Counter height is 36 inches standard'
  },
  dishwasher: {
    name: 'Built-in Dishwasher',
    category: 'appliance',
    typical: {
      width: { min: 24, max: 24, standard: 24 },
      height: { min: 34, max: 34, standard: 34 },
      depth: { min: 24, max: 24, standard: 24 }
    }
  },
  microwave_over_range: {
    name: 'Over-Range Microwave',
    category: 'appliance',
    typical: {
      width: { min: 30, max: 30, standard: 30 },
      height: { min: 16, max: 18, standard: 17 },
      depth: { min: 15, max: 16, standard: 15 }
    }
  },

  // Kitchen Cabinets
  base_cabinet: {
    name: 'Base Kitchen Cabinet',
    category: 'fixture',
    typical: {
      width: { min: 12, max: 48, standard: 24 },
      height: { min: 34.5, max: 34.5, standard: 34.5 },
      depth: { min: 24, max: 24, standard: 24 }
    },
    notes: 'With countertop, total height is 36 inches'
  },
  upper_cabinet: {
    name: 'Upper Kitchen Cabinet',
    category: 'fixture',
    typical: {
      width: { min: 12, max: 48, standard: 30 },
      height: { min: 30, max: 42, standard: 30 },
      depth: { min: 12, max: 12, standard: 12 }
    },
    notes: 'Typically 18 inches above countertop'
  },
  countertop: {
    name: 'Kitchen Countertop',
    category: 'fixture',
    typical: {
      width: { min: 24, max: 30, standard: 25 },
      height: { min: 36, max: 36, standard: 36 },
      depth: { min: 1.5, max: 1.5, standard: 1.5 }
    },
    notes: 'Standard counter height is critical measurement'
  },

  // Architectural Elements
  door_interior: {
    name: 'Interior Door',
    category: 'architectural',
    typical: {
      width: { min: 28, max: 36, standard: 32 },
      height: { min: 78, max: 80, standard: 80 },
      depth: { min: 1.375, max: 1.75, standard: 1.375 }
    },
    notes: 'Standard door height is 6\'8" (80 inches)'
  },
  door_exterior: {
    name: 'Exterior Door',
    category: 'architectural',
    typical: {
      width: { min: 36, max: 36, standard: 36 },
      height: { min: 78, max: 80, standard: 80 },
      depth: { min: 1.75, max: 1.75, standard: 1.75 }
    }
  },
  window_standard: {
    name: 'Standard Window',
    category: 'architectural',
    typical: {
      width: { min: 24, max: 72, standard: 36 },
      height: { min: 36, max: 60, standard: 48 },
      depth: { min: 4, max: 6, standard: 5 }
    },
    notes: 'Sill height typically 36 inches from floor'
  },
  baseboard: {
    name: 'Baseboard Trim',
    category: 'architectural',
    typical: {
      width: { min: 0, max: 0, standard: 0 },
      height: { min: 3, max: 8, standard: 5.5 },
      depth: { min: 0.5, max: 1, standard: 0.625 }
    },
    notes: 'Standard baseboard is 5.5 inches tall'
  },
  ceiling_standard: {
    name: 'Standard Ceiling Height',
    category: 'architectural',
    typical: {
      width: { min: 0, max: 0, standard: 0 },
      height: { min: 96, max: 108, standard: 96 },
      depth: { min: 0, max: 0, standard: 0 }
    },
    notes: '8 feet is standard, 9 feet is tall, 10+ is luxury'
  },
  ceiling_tall: {
    name: 'Tall Ceiling Height',
    category: 'architectural',
    typical: {
      width: { min: 0, max: 0, standard: 0 },
      height: { min: 108, max: 120, standard: 108 },
      depth: { min: 0, max: 0, standard: 0 }
    },
    notes: '9-10 feet'
  },
  ceiling_vaulted: {
    name: 'Vaulted Ceiling Height',
    category: 'architectural',
    typical: {
      width: { min: 0, max: 0, standard: 0 },
      height: { min: 120, max: 240, standard: 168 },
      depth: { min: 0, max: 0, standard: 0 }
    },
    notes: '10-20 feet at peak'
  },

  // Bathroom Fixtures
  toilet: {
    name: 'Standard Toilet',
    category: 'fixture',
    typical: {
      width: { min: 20, max: 20, standard: 20 },
      height: { min: 28, max: 31, standard: 30 },
      depth: { min: 28, max: 30, standard: 29 }
    }
  },
  vanity_single: {
    name: 'Single Bathroom Vanity',
    category: 'fixture',
    typical: {
      width: { min: 24, max: 48, standard: 36 },
      height: { min: 32, max: 36, standard: 34 },
      depth: { min: 18, max: 21, standard: 20 }
    }
  },
  vanity_double: {
    name: 'Double Bathroom Vanity',
    category: 'fixture',
    typical: {
      width: { min: 60, max: 72, standard: 60 },
      height: { min: 32, max: 36, standard: 34 },
      depth: { min: 18, max: 21, standard: 20 }
    }
  },
  bathtub_standard: {
    name: 'Standard Bathtub',
    category: 'fixture',
    typical: {
      width: { min: 30, max: 32, standard: 30 },
      height: { min: 14, max: 20, standard: 18 },
      depth: { min: 60, max: 60, standard: 60 }
    },
    notes: 'Standard tub is 5 feet long'
  },
  shower_standard: {
    name: 'Standard Shower',
    category: 'fixture',
    typical: {
      width: { min: 32, max: 36, standard: 36 },
      height: { min: 72, max: 80, standard: 72 },
      depth: { min: 32, max: 36, standard: 36 }
    }
  },

  // Common Furniture (for living spaces)
  sofa_standard: {
    name: 'Standard Sofa',
    category: 'furniture',
    typical: {
      width: { min: 72, max: 96, standard: 84 },
      height: { min: 30, max: 36, standard: 32 },
      depth: { min: 32, max: 40, standard: 36 }
    },
    notes: '7 feet long is standard'
  },
  bed_queen: {
    name: 'Queen Bed',
    category: 'furniture',
    typical: {
      width: { min: 60, max: 60, standard: 60 },
      height: { min: 24, max: 30, standard: 25 },
      depth: { min: 80, max: 80, standard: 80 }
    }
  },
  bed_king: {
    name: 'King Bed',
    category: 'furniture',
    typical: {
      width: { min: 76, max: 76, standard: 76 },
      height: { min: 24, max: 30, standard: 25 },
      depth: { min: 80, max: 80, standard: 80 }
    }
  },
  dining_table_rectangle: {
    name: 'Rectangular Dining Table',
    category: 'furniture',
    typical: {
      width: { min: 36, max: 48, standard: 42 },
      height: { min: 28, max: 30, standard: 30 },
      depth: { min: 60, max: 96, standard: 72 }
    },
    notes: 'Seats 6-8 people'
  }
};

/**
 * Building code minimums for validation
 */
export const BUILDING_CODE_MINIMUMS = {
  ceiling_height_habitable: 90, // 7'6" minimum for habitable rooms
  ceiling_height_bathroom: 84, // 7' minimum for bathrooms
  door_width_minimum: 32, // Accessibility standard
  hallway_width_minimum: 36,
  stair_width_minimum: 36,
  window_egress_opening: 5.7 // square feet for bedroom windows
};

/**
 * Get standard dimension for an object
 */
export function getStandardDimension(objectType: string): DimensionStandard | null {
  return STANDARD_DIMENSIONS[objectType] || null;
}

/**
 * Validate if detected dimensions match building codes
 */
export function validateAgainstCodes(
  measurement: string,
  value: number
): { valid: boolean; message: string } {
  switch (measurement) {
    case 'ceiling_height':
      if (value < BUILDING_CODE_MINIMUMS.ceiling_height_habitable) {
        return {
          valid: false,
          message: `Ceiling height ${value}" is below code minimum of 90" (7'6")`
        };
      }
      return { valid: true, message: 'Ceiling height meets code requirements' };

    case 'door_width':
      if (value < BUILDING_CODE_MINIMUMS.door_width_minimum) {
        return {
          valid: false,
          message: `Door width ${value}" is below accessibility minimum of 32"`
        };
      }
      return { valid: true, message: 'Door width meets code requirements' };

    default:
      return { valid: true, message: 'No code validation available' };
  }
}
