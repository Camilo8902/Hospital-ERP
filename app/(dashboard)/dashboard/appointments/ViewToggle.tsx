'use client';

import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  currentView: string;
  currentDate: string;
  status: string;
  searchTerm?: string;
}

export default function ViewToggle({ currentView, currentDate, status, searchTerm }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Link
        href={`/dashboard/appointments?date=${currentDate}&status=${status}&view=grid` + (searchTerm ? `&search=${searchTerm}` : '')}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${
          currentView === 'grid' || !currentView
            ? 'bg-white text-gray-900 shadow-sm font-medium'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Tarjetas</span>
      </Link>
      <Link
        href={`/dashboard/appointments?date=${currentDate}&status=${status}&view=list` + (searchTerm ? `&search=${searchTerm}` : '')}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${
          currentView === 'list'
            ? 'bg-white text-gray-900 shadow-sm font-medium'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Lista</span>
      </Link>
    </div>
  );
}
