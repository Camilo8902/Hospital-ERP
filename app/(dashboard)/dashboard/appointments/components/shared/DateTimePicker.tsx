'use client';

import { useState } from 'react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  min,
}: DateTimePickerProps) {
  return (
    <div>
      <label className="label mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className="input"
        required={required}
      />
    </div>
  );
}

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function TimePicker({
  label,
  value,
  onChange,
  required = false,
}: TimePickerProps) {
  return (
    <div>
      <label className="label mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        required={required}
      />
    </div>
  );
}
