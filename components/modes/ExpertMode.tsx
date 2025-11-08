'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DesignSettings } from '@/types';

export function ExpertMode() {
  const { applySettingsToAllRooms } = useStore();

  const [settings, setSettings] = useState<Partial<DesignSettings>>({
    designStyle: '',
    colorPalette: '',
    atmosphere: '',
    woodFinish: '',
    metalAccents: '',
    flooring: '',
    furnitureStyle: '',
    seating: '',
    storage: '',
    wallDecor: '',
    rugStyle: '',
    windowTreatments: '',
    greenery: '',
    texture: '',
    accents: '',
    lighting: '',
    consistency: '',
    pricePoint: '',
    customAdditions: '',
    customPromptOverride: '',
  });

  const handleChange = (field: keyof DesignSettings, value: string) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    applySettingsToAllRooms(newSettings);
  };

  const sections = [
    {
      title: 'Core Style',
      icon: '🎨',
      fields: [
        { key: 'designStyle', label: 'Design Style', placeholder: 'e.g., Modern Minimalist, Traditional, Scandinavian' },
        { key: 'colorPalette', label: 'Color Palette', placeholder: 'e.g., Neutral whites and grays, Warm earth tones' },
        { key: 'atmosphere', label: 'Atmosphere', placeholder: 'e.g., Cozy and intimate, Bright and airy' },
      ],
    },
    {
      title: 'Materials & Finishes',
      icon: '🪵',
      fields: [
        { key: 'woodFinish', label: 'Wood Finish', placeholder: 'e.g., Natural oak, Walnut, White-washed' },
        { key: 'metalAccents', label: 'Metal Accents', placeholder: 'e.g., Brushed gold, Matte black, Chrome' },
        { key: 'flooring', label: 'Flooring Preference', placeholder: 'e.g., Hardwood, Area rugs, Natural fibers' },
        { key: 'texture', label: 'Texture', placeholder: 'e.g., Smooth leather, Woven textiles, Plush fabrics' },
      ],
    },
    {
      title: 'Furniture',
      icon: '🛋️',
      fields: [
        { key: 'furnitureStyle', label: 'Furniture Style', placeholder: 'e.g., Mid-century modern, Contemporary' },
        { key: 'seating', label: 'Seating', placeholder: 'e.g., Sectional sofa, Armchairs, Bench seating' },
        { key: 'storage', label: 'Storage', placeholder: 'e.g., Built-in shelving, Console table, Hidden storage' },
      ],
    },
    {
      title: 'Decor & Accessories',
      icon: '🖼️',
      fields: [
        { key: 'wallDecor', label: 'Wall Decor', placeholder: 'e.g., Large abstract art, Gallery wall, Mirrors' },
        { key: 'rugStyle', label: 'Rug Style', placeholder: 'e.g., Persian, Geometric, Natural jute' },
        { key: 'windowTreatments', label: 'Window Treatments', placeholder: 'e.g., Linen curtains, Roman shades, Bare' },
        { key: 'greenery', label: 'Greenery', placeholder: 'e.g., Large floor plant, Small succulents, None' },
        { key: 'accents', label: 'Accents', placeholder: 'e.g., Throw pillows, Decorative objects, Books' },
      ],
    },
    {
      title: 'Lighting & Ambiance',
      icon: '💡',
      fields: [
        { key: 'lighting', label: 'Lighting', placeholder: 'e.g., Pendant lights, Floor lamps, Ambient LED' },
      ],
    },
    {
      title: 'Additional Settings',
      icon: '⚙️',
      fields: [
        { key: 'consistency', label: 'Consistency Level', placeholder: 'e.g., Cohesive throughout, Eclectic mix' },
        { key: 'pricePoint', label: 'Price Point', placeholder: 'e.g., Budget-friendly, High-end, Mixed' },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Expert Mode - Full Control
          </h2>
          <p className="text-gray-600">
            Configure every aspect of your staging design. All fields are optional - leave blank to use AI defaults.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-gray-700 font-medium">
                      {field.label}
                    </Label>
                    <input
                      id={field.key}
                      type="text"
                      value={settings[field.key as keyof DesignSettings] || ''}
                      onChange={(e) => handleChange(field.key as keyof DesignSettings, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Additions */}
          <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">✨</span>
              Custom Additions
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Add any additional specific requests or details not covered above
            </p>
            <Textarea
              value={settings.customAdditions || ''}
              onChange={(e) => handleChange('customAdditions', e.target.value)}
              placeholder="e.g., Add a reading nook by the window, Include home office setup, Make it pet-friendly..."
              rows={4}
              className="w-full"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Active Settings Summary:</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {Object.entries(settings).filter(([_, value]) => value && value.trim()).length > 0 ? (
              <div className="space-y-1 text-sm">
                {Object.entries(settings)
                  .filter(([_, value]) => value && value.trim())
                  .map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="text-gray-600 w-48 shrink-0">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-gray-900 font-medium">{value}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No settings configured yet. AI will use intelligent defaults.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
