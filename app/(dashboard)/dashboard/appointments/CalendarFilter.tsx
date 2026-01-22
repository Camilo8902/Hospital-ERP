'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarFilterProps {
  currentDate?: string;
  currentFilter: string;
  status: string;
  searchTerm?: string;
}

export default function CalendarFilter({ currentDate, currentFilter, status, searchTerm }: CalendarFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (currentDate) {
      return new Date(currentDate + 'T00:00:00');
    }
    return new Date();
  });
  const [internalDate, setInternalDate] = useState<string | undefined>(currentDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    // Crear fecha en hora local para evitar desfase de timezone
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Usar formato local YYYY-MM-DD directamente
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    
    setInternalDate(dateStr);
    setIsOpen(false);
    
    // Navegar inmediatamente a la URL con el filtro de fecha
    const searchParam = searchTerm ? `&search=${searchTerm}` : '';
    router.push(`/dashboard/appointments?date=${dateStr}&status=${status}${searchParam}`);
  };

  const handleClear = () => {
    setInternalDate(undefined);
    setSelectedMonth(new Date());
    setIsOpen(false);
    // Navegar a la URL sin filtro de fecha específico
    const searchParam = searchTerm ? `&search=${searchTerm}` : '';
    router.push(`/dashboard/appointments?date=${currentFilter}&status=${status}${searchParam}`);
  };

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentMonthDays = daysInMonth(selectedMonth);
  const firstDay = firstDayOfMonth(selectedMonth);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isSelectedDate = (day: number) => {
    if (!internalDate) return false;
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return dateStr === internalDate;
  };

  const isToday = (day: number) => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return dateStr === todayStr;
  };

  return (
    <div className="flex flex-col gap-2" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700">Fecha Específica</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all ${
            internalDate 
              ? 'border-primary-300 bg-primary-50 text-primary-700' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 ${internalDate ? 'text-primary-600' : 'text-gray-400'}`} />
          <span className="flex-1 text-left">
            {internalDate ? formatDateDisplay(internalDate) : 'Seleccionar fecha...'}
          </span>
          {internalDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </button>

        {/* Dropdown del calendario */}
        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border p-4 min-w-[320px]">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-semibold text-gray-900">
                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {/* Espacios vacíos para los días antes del primer día del mes */}
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="p-2"></div>
              ))}

              {/* Días del mes */}
              {Array.from({ length: currentMonthDays }).map((_, index) => {
                const day = index + 1;
                const isSelected = isSelectedDate(day);
                const todayCheck = isToday(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`p-2 text-sm rounded-lg transition-all relative ${
                      isSelected
                        ? 'bg-primary-600 text-white font-medium'
                        : todayCheck
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mostrar fecha seleccionada con link para limpiar */}
      {internalDate && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            ← Quitar filtro de fecha
          </button>
        </div>
      )}
    </div>
  );
}
