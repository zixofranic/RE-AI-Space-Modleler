'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Check, X } from 'lucide-react';

export function ImageGrouping() {
  const { uploadedImages, roomGroups, setRoomGroups } = useStore();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');

  // Get images that aren't already in a group
  const ungroupedImages = uploadedImages.filter(
    (img) => !roomGroups.some((group) => group.imageIds.includes(img.id))
  );

  const toggleSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const handleCreateGroup = () => {
    if (selectedImages.size < 2) {
      alert('Please select at least 2 images to group');
      return;
    }
    setShowGroupDialog(true);
  };

  const handleConfirmGroup = () => {
    if (!groupName.trim()) {
      alert('Please enter a room name');
      return;
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      imageIds: Array.from(selectedImages),
      roomType: groupName.trim(),
      primaryImageId: Array.from(selectedImages)[0],
    };

    setRoomGroups([...roomGroups, newGroup]);
    setSelectedImages(new Set());
    setGroupName('');
    setShowGroupDialog(false);
  };

  const handleUngroup = (groupId: string) => {
    setRoomGroups(roomGroups.filter((g) => g.id !== groupId));
  };

  if (uploadedImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tip Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">
              Group Multiple Angles (Optional)
            </p>
            <p className="text-sm text-blue-800">
              If you uploaded multiple photos of the same room, group them together to maintain consistent styling across all angles.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Groups */}
      {roomGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Grouped Rooms</h3>
          {roomGroups.map((group) => (
            <div
              key={group.id}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">
                    {group.roomType}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({group.imageIds.length} angles)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUngroup(group.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Ungroup
                </Button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {group.imageIds.map((imageId) => {
                  const image = uploadedImages.find((img) => img.id === imageId);
                  if (!image) return null;
                  return (
                    <div
                      key={imageId}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-purple-300"
                    >
                      <img
                        src={image.dataUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ungrouped Images Selection */}
      {ungroupedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Individual Images ({ungroupedImages.length})
            </h3>
            {selectedImages.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedImages.size} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleCreateGroup}
                  disabled={selectedImages.size < 2}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Group Selected
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ungroupedImages.map((image) => {
              const isSelected = selectedImages.has(image.id);
              return (
                <div
                  key={image.id}
                  onClick={() => toggleSelection(image.id)}
                  className={`
                    relative cursor-pointer border-3 rounded-xl overflow-hidden
                    transition-all duration-200 hover:scale-[1.02]
                    ${
                      isSelected
                        ? 'border-purple-600 shadow-lg ring-4 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    }
                  `}
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Selection Indicator */}
                  <div
                    className={`
                      absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200
                      ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'bg-white border-gray-300'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-700 truncate">{image.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Name Dialog */}
      {showGroupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Name This Room</h3>
            <p className="text-sm text-gray-600 mb-4">
              Give this group a name (e.g., "Living Room", "Master Bedroom")
            </p>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Living Room"
              className="mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmGroup();
                if (e.key === 'Escape') {
                  setShowGroupDialog(false);
                  setGroupName('');
                }
              }}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupDialog(false);
                  setGroupName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmGroup}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
