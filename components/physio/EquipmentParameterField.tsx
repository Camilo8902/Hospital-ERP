// Componente para renderizar campos configurables de equipos de fisioterapia
// Soporta: number, text, select, range, boolean

'use client';

import React from 'react';
import { EquipmentFieldOption, PhysioEquipmentParameterField } from '@/lib/types/physiotherapy';

interface EquipmentParameterFieldProps {
  field: PhysioEquipmentParameterField;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function EquipmentParameterField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: EquipmentParameterFieldProps) {
  const fieldId = `equipment-field-${field.id}`;
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    onChange(isNaN(numValue) ? 0 : numValue);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };
  
  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };
  
  // Campo de tipo number
  if (field.field_type === 'number') {
    return (
      <div key={field.id} className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {field.field_label}
          {field.field_required && <span className="text-red-500 ml-1">*</span>}
          {field.field_unit && <span className="text-gray-500 ml-1">({field.field_unit})</span>}
        </label>
        {field.field_description && (
          <p className="text-xs text-gray-500">{field.field_description}</p>
        )}
        <input
          type="number"
          id={fieldId}
          name={field.field_name}
          value={value ?? ''}
          onChange={handleNumberChange}
          min={field.field_min}
          max={field.field_max}
          step={field.field_step || 1}
          disabled={disabled}
          className={`input ${error ? 'border-red-500' : ''}`}
        />
        {(field.field_min !== undefined || field.field_max !== undefined) && (
          <p className="text-xs text-gray-500">
            Rango: {field.field_min ?? 'N/A'} - {field.field_max ?? 'N/A'}
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
  
  // Campo de tipo range (slider)
  if (field.field_type === 'range') {
    const rangeValue = typeof value === 'number' ? value : (field.field_default_value ? parseFloat(field.field_default_value) : 0);
    
    return (
      <div key={field.id} className="space-y-1">
        <div className="flex justify-between">
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
            {field.field_label}
            {field.field_required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <span className="text-sm text-gray-600">
            {rangeValue}
            {field.field_unit && <span className="ml-1">{field.field_unit}</span>}
          </span>
        </div>
        {field.field_description && (
          <p className="text-xs text-gray-500">{field.field_description}</p>
        )}
        <input
          type="range"
          id={fieldId}
          name={field.field_name}
          value={rangeValue}
          onChange={handleNumberChange}
          min={field.field_min || 0}
          max={field.field_max || 100}
          step={field.field_step || 1}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{field.field_min ?? 0}</span>
          <span>{field.field_max ?? 100}</span>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
  
  // Campo de tipo text
  if (field.field_type === 'text') {
    return (
      <div key={field.id} className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {field.field_label}
          {field.field_required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.field_description && (
          <p className="text-xs text-gray-500">{field.field_description}</p>
        )}
        <input
          type="text"
          id={fieldId}
          name={field.field_name}
          value={value ?? ''}
          onChange={handleTextChange}
          disabled={disabled}
          className={`input ${error ? 'border-red-500' : ''}`}
          placeholder={field.field_default_value || ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
  
  // Campo de tipo select
  if (field.field_type === 'select') {
    const options: EquipmentFieldOption[] = field.field_options || [];
    
    return (
      <div key={field.id} className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {field.field_label}
          {field.field_required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.field_description && (
          <p className="text-xs text-gray-500">{field.field_description}</p>
        )}
        <select
          id={fieldId}
          name={field.field_name}
          value={value ?? ''}
          onChange={handleSelectChange}
          disabled={disabled}
          className={`input ${error ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
  
  // Campo de tipo boolean (checkbox)
  if (field.field_type === 'boolean') {
    const boolValue = typeof value === 'boolean' ? value : (field.field_default_value === 'true');
    
    return (
      <div key={field.id} className="space-y-1">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id={fieldId}
            name={field.field_name}
            checked={boolValue}
            onChange={handleBooleanChange}
            disabled={disabled}
            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
              {field.field_label}
              {field.field_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.field_description && (
              <p className="text-xs text-gray-500">{field.field_description}</p>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-500 ml-8">{error}</p>}
      </div>
    );
  }
  
  // Tipo desconocido
  return (
    <div key={field.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
      <p className="text-sm text-yellow-700">
        Tipo de campo no reconocido: {field.field_type}
      </p>
    </div>
  );
}

interface EquipmentParametersFormProps {
  fields: PhysioEquipmentParameterField[];
  values: Record<string, string | number | boolean>;
  onChange: (name: string, value: string | number | boolean) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showFieldOrder?: number[]; // Array de field_order para mostrar en orden específico
}

export function EquipmentParametersForm({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  showFieldOrder,
}: EquipmentParametersFormProps) {
  // Ordenar campos por field_order
  const sortedFields = [...fields].sort((a, b) => a.field_order - b.field_order);
  
  // Filtrar campos visibles
  const visibleFields = sortedFields.filter(f => f.field_visible);
  
  if (visibleFields.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">No hay parámetros configurables para este equipo.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {visibleFields.map((field) => (
        <EquipmentParameterField
          key={field.id}
          field={field}
          value={values[field.field_name]}
          onChange={(value) => onChange(field.field_name, value)}
          error={errors[field.field_name]}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
