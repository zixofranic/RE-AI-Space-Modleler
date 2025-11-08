'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Home, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PropertySelector() {
  const {
    currentProperty,
    availableProperties,
    setCurrentProperty,
    loadAvailableProperties,
  } = useStore();

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    loadAvailableProperties();
  }, [loadAvailableProperties]);

  const handleCreateNew = () => {
    const name = newPropertyName.trim() || 'Untitled Property';
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setCurrentProperty({
      id: projectId,
      name,
      address: newPropertyAddress.trim() || undefined,
      isNew: true,
    });
  };

  const handleSelectExisting = () => {
    const selected = availableProperties.find(p => p.id === selectedPropertyId);
    if (selected) {
      setCurrentProperty({
        id: selected.id,
        name: selected.name,
        address: selected.address,
        isNew: false,
      });
    }
  };

  const hasSelection = mode === 'new' ? newPropertyName.trim() : selectedPropertyId;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Home className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Property</h3>
          <p className="text-sm text-gray-800">Create new or add to existing property</p>
        </div>
      </div>

      {/* Current Selection Display */}
      {currentProperty && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-full p-2">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900">{currentProperty.name}</p>
              {currentProperty.address && (
                <p className="text-sm text-green-900">{currentProperty.address}</p>
              )}
              <p className="text-xs text-green-800 mt-1">
                {currentProperty.isNew ? 'New property' : 'Existing property'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentProperty(null)}
              className="ml-auto"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Property Selection (only show if no selection made) */}
      {!currentProperty && (
        <>
          {/* Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('new')}
              className={`
                flex-1 py-3 px-4 rounded-lg border-2 transition-all
                ${mode === 'new'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-900'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New</span>
              </div>
            </button>

            <button
              onClick={() => setMode('existing')}
              className={`
                flex-1 py-3 px-4 rounded-lg border-2 transition-all
                ${mode === 'existing'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-900'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                <span className="font-medium">Add to Existing</span>
              </div>
            </button>
          </div>

          {/* New Property Form */}
          {mode === 'new' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="e.g., 123 Main Street, Beach House, Downtown Condo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Address (optional)
                </label>
                <input
                  type="text"
                  value={newPropertyAddress}
                  onChange={(e) => setNewPropertyAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, San Francisco, CA 94102"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleCreateNew}
                disabled={!newPropertyName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                Create Property & Continue
              </Button>
            </div>
          )}

          {/* Existing Property Selector */}
          {mode === 'existing' && (
            <div className="space-y-4">
              {availableProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-800">
                  <Home className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No existing properties found.</p>
                  <p className="text-sm mt-1">Create a new property to get started.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Property
                    </label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose a property...</option>
                      {availableProperties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                          {property.imageCount ? ` (${property.imageCount} images)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Show property details when selected */}
                  {selectedPropertyId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      {(() => {
                        const selected = availableProperties.find(p => p.id === selectedPropertyId);
                        return selected ? (
                          <>
                            <p className="font-semibold text-gray-900">{selected.name}</p>
                            {selected.address && (
                              <p className="text-sm text-gray-800 mt-1">{selected.address}</p>
                            )}
                            <p className="text-xs text-gray-700 mt-2">
                              {selected.imageCount || 0} existing images
                            </p>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <Button
                    onClick={handleSelectExisting}
                    disabled={!selectedPropertyId}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    Add to This Property
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
