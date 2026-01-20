'use client';

import { useState } from 'react';
import { Bell, User, ChevronDown, LogOut, Settings, Menu } from 'lucide-react';
import { getInitials, getRoleLabel, getRoleColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMobileMenu } from './MobileMenuContext';

interface HeaderProps {
  userName: string;
  userRole: string;
  userEmail: string;
}

export default function Header({ userName, userRole, userEmail }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toggleMobileMenu } = useMobileMenu();

  const notifications = [
    { id: 1, title: 'Nueva cita programada', message: 'Juan Pérez tiene cita a las 10:00 AM', time: '5 min ago', read: false },
    { id: 2, title: 'Receta pendiente', message: '3 recetas requieren dispensación', time: '1 hora ago', read: false },
    { id: 3, title: 'Stock bajo', message: 'Paracetamol 500mg por debajo del mínimo', time: '2 horas ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">MediCore ERP</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fade-in z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={cn('px-4 py-3 hover:bg-gray-50 cursor-pointer', !notification.read ? 'bg-blue-50' : '')}>
                      <div className="flex items-start gap-3">
                        <div className={cn('w-2 h-2 mt-2 rounded-full flex-shrink-0', !notification.read ? 'bg-primary-500' : 'bg-gray-300')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {getInitials(userName)}
              </div>
              <div className="hidden sm:block text-left max-w-32">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className={cn('text-xs px-2 py-0.5 rounded-full inline-block', getRoleColor(userRole))}>
                  {getRoleLabel(userRole)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fade-in z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 touch-manipulation">
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 touch-manipulation">
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
