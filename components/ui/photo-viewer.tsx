'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PhotoViewerProps {
  images: Array<{ src: string; alt: string; filename?: string }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewer({ images, initialIndex = 0, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoom]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = currentImage.filename || `image-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-white font-medium">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="bg-black bg-opacity-50 border-gray-600 text-white hover:bg-opacity-70"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="bg-black bg-opacity-50 border-gray-600 text-white hover:bg-opacity-70"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Download */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="bg-black bg-opacity-50 border-gray-600 text-white hover:bg-opacity-70"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            {/* Close */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="bg-black bg-opacity-50 border-gray-600 text-white hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            maxWidth: zoom > 1 ? 'none' : '90vw',
            maxHeight: zoom > 1 ? 'none' : '85vh',
          }}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto max-w-full px-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={`
                  shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                  ${index === currentIndex
                    ? 'border-purple-500 ring-2 ring-purple-300'
                    : 'border-gray-600 hover:border-gray-400 opacity-70 hover:opacity-100'
                  }
                `}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full pointer-events-none">
        <span className="hidden sm:inline">← → to navigate | +/- to zoom | ESC to close</span>
        <span className="sm:hidden">Tap arrows to navigate</span>
      </div>
    </div>
  );
}
