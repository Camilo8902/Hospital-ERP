'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StrengthGradeProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
  side?: 'left' | 'right' | 'bilateral';
}

const strengthScale = [
  { grade: 0, label: '0', description: 'Paralisis total', color: 'bg-gray-200 text-gray-600' },
  { grade: 1, label: '1', description: 'Contracción visible sin movimiento', color: 'bg-red-200 text-red-700' },
  { grade: 2, label: '2', description: 'Movimiento con gravedad eliminada', color: 'bg-orange-200 text-orange-700' },
  { grade: 3, label: '3', description: 'Movimiento contra gravedad', color: 'bg-yellow-200 text-yellow-700' },
  { grade: 4, label: '4', description: 'Movimiento contra resistencia parcial', color: 'bg-blue-200 text-blue-700' },
  { grade: 5, label: '5', description: 'Fuerza normal completa', color: 'bg-green-200 text-green-700' },
];

export function StrengthGrade({ 
  value, 
  onChange, 
  label = 'Fuerza Muscular', 
  disabled = false,
  side
}: StrengthGradeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentGrade = strengthScale.find(s => s.grade === value) || strengthScale[0];

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Current Selection */}
      <button
        type="button"
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={`w-full p-3 rounded-lg border flex items-center justify-between transition-colors ${
          disabled 
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:border-purple-300 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${currentGrade.color}`}>
            {value}
          </span>
          <div className="text-left">
            <p className="font-medium text-gray-900">Grado {value}</p>
            <p className="text-sm text-gray-500">{currentGrade.description}</p>
          </div>
        </div>
        {!disabled && (
          isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-2 p-3 bg-gray-50 rounded-lg">
          {strengthScale.map((grade) => (
            <button
              key={grade.grade}
              type="button"
              onClick={() => {
                onChange(grade.grade);
                setIsExpanded(false);
              }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                value === grade.grade
                  ? 'bg-purple-100 border border-purple-300'
                  : 'bg-white border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${grade.color}`}>
                {grade.grade}
              </span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Grado {grade.grade}</p>
                <p className="text-xs text-gray-500">{grade.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Side indicator if provided */}
      {side && (
        <div className="flex justify-end">
          <span className={`text-xs px-2 py-1 rounded ${
            side === 'left' ? 'bg-blue-100 text-blue-700' : 
            side === 'right' ? 'bg-red-100 text-red-700' : 
            'bg-purple-100 text-purple-700'
          }`}>
            {side === 'left' ? 'Izquierdo' : side === 'right' ? 'Derecho' : 'Bilateral'}
          </span>
        </div>
      )}
    </div>
  );
}

// Component for bilateral strength measurement (left and right)
interface BilateralStrengthProps {
  leftValue: number;
  rightValue: number;
  onLeftChange: (value: number) => void;
  onRightChange: (value: number) => void;
  label?: string;
  muscleGroup?: string;
  disabled?: boolean;
}

export function BilateralStrength({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  label = 'Fuerza Muscular',
  muscleGroup,
  disabled = false,
}: BilateralStrengthProps) {
  return (
    <div className="space-y-2">
      {muscleGroup && (
        <p className="text-sm font-medium text-gray-700">{muscleGroup}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <StrengthGrade
          value={leftValue}
          onChange={onLeftChange}
          label={muscleGroup ? undefined : 'Izquierdo'}
          side="left"
          disabled={disabled}
        />
        <StrengthGrade
          value={rightValue}
          onChange={onRightChange}
          label={muscleGroup ? undefined : 'Derecho'}
          side="right"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
