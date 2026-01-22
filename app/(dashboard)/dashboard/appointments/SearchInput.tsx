'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  currentView: string;
  currentDate: string;
  status: string;
}

export default function SearchInput({ currentView, currentDate, status }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construir la URL con los parámetros actuales más la búsqueda
    const params = new URLSearchParams();
    params.set('date', currentDate);
    params.set('status', status);
    params.set('view', currentView);
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchTerm('');
    
    // Navegar sin el parámetro de búsqueda
    const params = new URLSearchParams();
    params.set('date', currentDate);
    params.set('status', status);
    params.set('view', currentView);
    
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Buscar</label>
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por paciente, doctor, motivo..."
          className="input pl-10 pr-10 w-64"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </form>
    </div>
  );
}
