'use client';

import { useState } from 'react';
import { Smile, Frown } from 'lucide-react';

interface VASScaleProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

const painDescriptions = [
  { value: 0, label: 'Sin dolor', color: 'text-green-600' },
  { value: 2, label: 'Muy leve', color: 'text-green-400' },
  { value: 4, label: 'Leve', color: 'text-yellow-500' },
  { value: 6, label: 'Moderado', color: 'text-orange-500' },
  { value: 8, label: 'Severo', color: 'text-orange-600' },
  { value: 10, label: 'Muy severo', color: 'text-red-600' },
];

export function VASScale({ value, onChange, label = 'Nivel de Dolor', disabled = false }: VASScaleProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const getPainLevel = (val: number) => {
    if (val <= 1) return { label: 'Sin dolor', color: 'bg-green-500' };
    if (val <= 3) return { label: 'Muy leve', color: 'bg-green-400' };
    if (val <= 5) return { label: 'Leve', color: 'bg-yellow-400' };
    if (val <= 7) return { label: 'Moderado', color: 'bg-yellow-500' };
    if (val <= 9) return { label: 'Severo', color: 'bg-orange-500' };
    return { label: 'Muy severo', color: 'bg-red-500' };
  };

  const currentLevel = getPainLevel(value);
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="relative">
        {/* Slider */}
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        
        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <div className="flex items-center gap-1">
            <Smile className="w-4 h-4 text-green-500" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <span>10</span>
            <Frown className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Value Display */}
      <div className="flex items-center gap-3">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${currentLevel.color}`}
        >
          {value}
        </div>
        <div>
          <p className="font-medium text-gray-900">{currentLevel.label}</p>
          <p className="text-sm text-gray-500">
            {value}/10 en escala VAS
          </p>
        </div>
      </div>

      {/* Quick Select Buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 mt-3">
          {painDescriptions.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                value === level.value
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
