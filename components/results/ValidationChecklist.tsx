'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ValidationChecklistProps {
  onIssueReport?: (issue: string) => void;
}

const VALIDATION_CHECKS = [
  {
    id: 'doorways',
    category: 'Critical',
    question: 'Are all doorways, archways, and passages completely clear?',
    description: 'No furniture should block any openings or walkways',
    severity: 'critical',
  },
  {
    id: 'shadows',
    category: 'Quality',
    question: 'Does all furniture have visible shadows touching the floor?',
    description: 'Furniture should not appear to be floating',
    severity: 'high',
  },
  {
    id: 'sizing',
    category: 'Critical',
    question: 'Is all furniture appropriately sized for the room?',
    description: 'Sofa should be ~7 feet, chairs ~3 feet, with walking space',
    severity: 'critical',
  },
  {
    id: 'architecture',
    category: 'Critical',
    question: 'Are all walls, windows, and doors unchanged from original?',
    description: 'No architectural elements should be modified',
    severity: 'critical',
  },
  {
    id: 'placement',
    category: 'Quality',
    question: 'Is furniture placed against solid walls or in room center?',
    description: 'Furniture should showcase architecture, not hide it',
    severity: 'medium',
  },
  {
    id: 'consistency',
    category: 'Quality',
    question: 'Do shadows all point in the same direction?',
    description: 'All shadows should be consistent with light source',
    severity: 'medium',
  },
];

export function ValidationChecklist({ onIssueReport }: ValidationChecklistProps) {
  const [checks, setChecks] = useState<Record<string, boolean | null>>(
    VALIDATION_CHECKS.reduce((acc, check) => ({ ...acc, [check.id]: null }), {})
  );

  const handleCheck = (id: string, passed: boolean) => {
    setChecks((prev) => ({ ...prev, [id]: passed }));
  };

  const criticalIssues = VALIDATION_CHECKS.filter(
    (check) => check.severity === 'critical' && checks[check.id] === false
  );

  const allCriticalPassed = VALIDATION_CHECKS
    .filter((check) => check.severity === 'critical')
    .every((check) => checks[check.id] === true);

  const allChecked = Object.values(checks).every((val) => val !== null);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Quality Validation Checklist
            </h3>
          </div>
        {allChecked && (
          <div className="text-sm font-medium">
            {allCriticalPassed ? (
              <span className="text-green-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Looks good!
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                {criticalIssues.length} critical issue{criticalIssues.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        </div>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900">
            <strong>📋 Manual Quality Check:</strong> This is a checklist for YOU to verify the generated image quality.
            Click <span className="inline-flex items-center mx-1"><CheckCircle2 className="w-3 h-3" /></span> if the item passes or
            <span className="inline-flex items-center mx-1"><XCircle className="w-3 h-3" /></span> if it fails.
            This helps identify issues before downloading.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {VALIDATION_CHECKS.map((check) => {
          const status = checks[check.id];
          return (
            <div
              key={check.id}
              className={`border-2 rounded-lg p-3 transition-all ${
                status === true
                  ? 'border-green-300 bg-green-50'
                  : status === false
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${
                        check.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : check.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {check.category}
                    </span>
                    <p className="font-medium text-gray-900">{check.question}</p>
                  </div>
                  <p className="text-sm text-gray-600 ml-0">{check.description}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleCheck(check.id, true)}
                    className={`p-2 rounded-lg transition-colors ${
                      status === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                    }`}
                    title="Pass"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCheck(check.id, false)}
                    className={`p-2 rounded-lg transition-colors ${
                      status === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    }`}
                    title="Fail"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {criticalIssues.length > 0 && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="font-semibold text-red-900 mb-2">
            Critical Issues Detected:
          </p>
          <ul className="list-disc list-inside text-red-800 text-sm space-y-1">
            {criticalIssues.map((issue) => (
              <li key={issue.id}>{issue.question}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-red-800">
            💡 <strong>Suggestion:</strong> Use the "Edit" feature to fix these issues, or regenerate the image with more specific instructions.
          </p>
        </div>
      )}

      {allCriticalPassed && allChecked && (
        <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="font-semibold text-green-900">
            ✅ All critical checks passed! This image meets quality standards.
          </p>
        </div>
      )}
    </div>
  );
}
