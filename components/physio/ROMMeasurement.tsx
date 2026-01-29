'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ROMMeasurementProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const jointMovements: Record<string, { label: string; defaultRange: [number, number] }[]> = {
  'Hombro': [
    { label: 'Flexión', defaultRange: [0, 180] },
    { label: 'Extensión', defaultRange: [0, 60] },
    { label: 'Abducción', defaultRange: [0, 180] },
    { label: 'Aducción', defaultRange: [0, 45] },
    { label: 'Rotación interna', defaultRange: [0, 70] },
    { label: 'Rotación externa', defaultRange: [0, 90] },
  ],
  'Codo': [
    { label: 'Flexión', defaultRange: [0, 150] },
    { label: 'Extensión', defaultRange: [0, 0] },
    { label: 'Pronación', defaultRange: [0, 80] },
    { label: 'Supinación', defaultRange: [0, 80] },
  ],
  'Muñeca': [
    { label: 'Flexión', defaultRange: [0, 80] },
    { label: 'Extensión', defaultRange: [0, 70] },
    { label: 'Desviación radial', defaultRange: [0, 20] },
    { label: 'Desviación cubital', defaultRange: [0, 30] },
  ],
  'Cadera': [
    { label: 'Flexión', defaultRange: [0, 120] },
    { label: 'Extensión', defaultRange: [0, 30] },
    { label: 'Abducción', defaultRange: [0, 45] },
    { label: 'Aducción', defaultRange: [0, 30] },
    { label: 'Rotación interna', defaultRange: [0, 45] },
    { label: 'Rotación externa', defaultRange: [0, 45] },
  ],
  'Rodilla': [
    { label: 'Flexión', defaultRange: [0, 135] },
    { label: 'Extensión', defaultRange: [0, 0] },
  ],
  'Tobillo': [
    { label: 'Dorsiflexión', defaultRange: [0, 20] },
    { label: 'Flexión plantar', defaultRange: [0, 50] },
    { label: 'Inversión', defaultRange: [0, 35] },
    { label: 'Eversión', defaultRange: [0, 15] },
  ],
  'Columna': [
    { label: 'Flexión', defaultRange: [0, 90] },
    { label: 'Extensión', defaultRange: [0, 30] },
    { label: 'Flexión lateral', defaultRange: [0, 45] },
    { label: 'Rotación', defaultRange: [0, 45] },
  ],
};

export function ROMMeasurement({
  value,
  onChange,
  label = 'Rango de Movimiento',
  unit = '°',
  min = 0,
  max = 180,
  disabled = false,
}: ROMMeasurementProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate percentage of normal
  const getNormalPercentage = (val: number, maxVal: number) => {
    return Math.round((val / maxVal) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const percentage = getNormalPercentage(value, max);

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="flex items-center gap-4">
        {/* Value Display */}
        <div className={`text-3xl font-bold ${getStatusColor(percentage)}`}>
          {value}{unit}
        </div>

        {/* Percentage */}
        <div className="text-sm text-gray-500">
          ({percentage}% del normal)
        </div>

        {/* Expand Button */}
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto p-2 hover:bg-gray-100 rounded-lg"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />

      {/* Quick Select Buttons */}
      {isExpanded && (
        <div className="grid grid-cols-5 gap-1 p-2 bg-gray-50 rounded-lg">
          {[0, 25, 50, 75, 100].map((percent) => {
            const quickValue = Math.round((max * percent) / 100);
            return (
              <button
                key={percent}
                type="button"
                onClick={() => onChange(quickValue)}
                className={`p-2 text-sm rounded transition-colors ${
                  value === quickValue
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {quickValue}{unit}
              </button>
            );
          })}
        </div>
      )}

      {/* Reference Range */}
      <p className="text-xs text-gray-400">
        Rango normal de referencia: {min}{unit} - {max}{unit}
      </p>
    </div>
  );
}

// Component for bilateral ROM measurement
interface BilateralROMProps {
  joint: string;
  movement: string;
  leftValue: number;
  rightValue: number;
  onLeftChange: (value: number) => void;
  onRightChange: (value: number) => void;
  unit?: string;
  max?: number;
  disabled?: boolean;
}

export function BilateralROM({
  joint,
  movement,
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  unit = '°',
  max = 180,
  disabled = false,
}: BilateralROMProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{joint} - {movement}</p>
      <div className="grid grid-cols-2 gap-4">
        <ROMMeasurement
          value={leftValue}
          onChange={onLeftChange}
          label="Izquierdo"
          unit={unit}
          max={max}
          disabled={disabled}
        />
        <ROMMeasurement
          value={rightValue}
          onChange={onRightChange}
          label="Derecho"
          unit={unit}
          max={max}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// Component for selecting joint and movement
interface JointROMSelectorProps {
  joint: string;
  movement: string;
  leftValue: number;
  rightValue: number;
  onJointChange: (joint: string) => void;
  onMovementChange: (movement: string) => void;
  onLeftChange: (value: number) => void;
  onRightChange: (value: number) => void;
  disabled?: boolean;
}

export function JointROMSelector({
  joint,
  movement,
  leftValue,
  rightValue,
  onJointChange,
  onMovementChange,
  onLeftChange,
  onRightChange,
  disabled = false,
}: JointROMSelectorProps) {
  const joints = Object.keys(jointMovements);
  const movements = jointMovements[joint] || [];
  const maxRange = movements.find(m => m.label === movement)?.defaultRange[1] || 180;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-1.5">Articulación</label>
          <select
            value={joint}
            onChange={(e) => {
              onJointChange(e.target.value);
              onMovementChange(movements[0]?.label || '');
            }}
            disabled={disabled}
            className="input"
          >
            {joints.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1.5">Movimiento</label>
          <select
            value={movement}
            onChange={(e) => onMovementChange(e.target.value)}
            disabled={disabled}
            className="input"
          >
            {movements.map((m) => (
              <option key={m.label} value={m.label}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ROMMeasurement
          value={leftValue}
          onChange={onLeftChange}
          label="Izquierdo"
          max={maxRange}
          disabled={disabled}
        />
        <ROMMeasurement
          value={rightValue}
          onChange={onRightChange}
          label="Derecho"
          max={maxRange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
