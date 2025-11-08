'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'designStyle',
    question: 'What overall style do you prefer?',
    options: [
      { value: 'Modern', label: 'Modern', description: 'Clean lines, minimal ornamentation' },
      { value: 'Traditional', label: 'Traditional', description: 'Classic, timeless elegance' },
      { value: 'Contemporary', label: 'Contemporary', description: 'Current trends, bold statements' },
      { value: 'Transitional', label: 'Transitional', description: 'Mix of modern and traditional' },
      { value: 'Scandinavian', label: 'Scandinavian', description: 'Light, airy, functional' },
      { value: 'Industrial', label: 'Industrial', description: 'Raw materials, urban edge' },
    ],
  },
  {
    id: 'colorPalette',
    question: 'What color palette appeals to you?',
    options: [
      { value: 'Neutral whites and grays', label: 'Neutral', description: 'Whites, grays, beiges' },
      { value: 'Warm earth tones', label: 'Warm Tones', description: 'Browns, terracottas, warm creams' },
      { value: 'Cool blues and greens', label: 'Cool Tones', description: 'Blues, greens, cool grays' },
      { value: 'Bold jewel tones', label: 'Jewel Tones', description: 'Rich emeralds, sapphires, rubies' },
      { value: 'Monochromatic', label: 'Monochrome', description: 'Single color in varying shades' },
      { value: 'Pastels', label: 'Pastels', description: 'Soft, muted colors' },
    ],
  },
  {
    id: 'atmosphere',
    question: 'What atmosphere do you want to create?',
    options: [
      { value: 'Cozy and intimate', label: 'Cozy', description: 'Warm, inviting, comfortable' },
      { value: 'Bright and airy', label: 'Bright & Airy', description: 'Light, spacious, open' },
      { value: 'Luxurious and elegant', label: 'Luxurious', description: 'Sophisticated, refined, upscale' },
      { value: 'Casual and relaxed', label: 'Casual', description: 'Laid-back, comfortable, easygoing' },
      { value: 'Sophisticated and modern', label: 'Sophisticated', description: 'Polished, contemporary, stylish' },
      { value: 'Rustic and natural', label: 'Rustic', description: 'Natural materials, organic feel' },
    ],
  },
  {
    id: 'furnitureStyle',
    question: 'What furniture style do you prefer?',
    options: [
      { value: 'Sleek modern pieces', label: 'Modern', description: 'Minimalist, geometric forms' },
      { value: 'Comfortable overstuffed seating', label: 'Plush', description: 'Soft, inviting, deep cushions' },
      { value: 'Mid-century modern', label: 'Mid-Century', description: '1950s-60s inspired classics' },
      { value: 'Vintage/Antique', label: 'Vintage', description: 'Aged character, unique pieces' },
      { value: 'Contemporary designer', label: 'Designer', description: 'High-end, statement pieces' },
      { value: 'Eclectic mix', label: 'Eclectic', description: 'Variety of styles and periods' },
    ],
  },
  {
    id: 'pricePoint',
    question: 'What price point should the staging suggest?',
    options: [
      { value: 'Budget-friendly', label: 'Budget', description: 'Affordable, accessible pieces' },
      { value: 'Mid-range', label: 'Mid-Range', description: 'Quality without breaking bank' },
      { value: 'High-end', label: 'High-End', description: 'Premium, luxury furnishings' },
      { value: 'Mixed (splurge + save)', label: 'Mixed', description: 'Key investment pieces + affordable accents' },
    ],
  },
  {
    id: 'greenery',
    question: 'How much greenery do you want?',
    options: [
      { value: 'None', label: 'None', description: 'No plants' },
      { value: 'Minimal (1-2 small plants)', label: 'Minimal', description: 'Just a touch of green' },
      { value: 'Moderate (3-5 plants)', label: 'Moderate', description: 'Balanced plant presence' },
      { value: 'Abundant (lots of greenery)', label: 'Abundant', description: 'Urban jungle vibe' },
    ],
  },
];

export function GuidedMode() {
  const { applySettingsToAllRooms } = useStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Apply to store
    applySettingsToAllRooms(newAnswers as any);

    // Auto-advance to next question
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    }
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {question.question}
          </h3>
          <p className="text-gray-600">Select the option that best fits your vision</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`
                  p-6 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestion < QUESTIONS.length - 1 && answers[question.id] && (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
            >
              Next Question
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentQuestion === QUESTIONS.length - 1 && (
            <div className="text-green-600 font-semibold">
              ✓ All questions answered!
            </div>
          )}
        </div>

        {/* Summary of Answers */}
        {Object.keys(answers).length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Your Selections:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(answers).map(([key, value]) => (
                <span
                  key={key}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
