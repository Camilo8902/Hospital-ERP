'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  UserCog,
  FlaskConical,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMobileMenu } from './MobileMenuContext';

interface SidebarProps {
  userRole: string;
  userName: string;
}

const navigationConfig = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'nurse', 'reception', 'pharmacy'],
  },
  {
    name: 'Pacientes',
    href: '/dashboard/patients',
    icon: Users,
    roles: ['admin', 'doctor', 'nurse', 'reception'],
  },
  {
    name: 'Citas',
    href: '/dashboard/appointments',
    icon: Calendar,
    roles: ['admin', 'doctor', 'nurse', 'reception'],
  },
  {
    name: 'Farmacia',
    href: '/dashboard/pharmacy',
    icon: Pill,
    roles: ['admin', 'pharmacy', 'doctor'],
  },
  {
    name: 'Laboratorio',
    href: '/dashboard/lab',
    icon: FlaskConical,
    roles: ['admin', 'lab', 'lab_admin', 'doctor', 'nurse'],
  },
  {
    name: 'Facturacion',
    href: '/dashboard/billing',
    icon: FileText,
    roles: ['admin', 'reception'],
  },
  {
    name: 'Reportes',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['admin', 'doctor'],
  },
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    name: 'Configuracion',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = navigationConfig.filter((item) => {
    return item.roles.includes(userRole as string);
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesion:', error.message);
        setIsLoggingOut(false);
        return;
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error inesperado al cerrar sesion:', error);
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = () => {
    if (isMobile) {
      closeMobileMenu();
    }
  };

  const desktopSidebar = (
    <aside
      className={cn(
        'hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">MediCore</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}>
          {collapsed ? (
            <Menu className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className={cn('w-5 h-5 text-gray-600 transition-transform', collapsed && 'rotate-180')} />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.name} href={item.href} onClick={handleNavigation} className={cn('sidebar-link', isActive && 'sidebar-link-active', collapsed && 'justify-center px-2 lg:px-1')} title={collapsed ? item.name : undefined}>
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button onClick={handleLogout} className={cn('sidebar-link w-full text-red-600 hover:text-red-700 hover:bg-red-50', collapsed && 'justify-center px-2 lg:px-1')} title={collapsed ? 'Cerrar sesión' : undefined}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );

  const mobileDrawer = (
    <>
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileMenu} aria-hidden="true" />}
      <div className={cn('fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 lg:hidden transform transition-transform duration-300 ease-in-out', isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavigation}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">MediCore</span>
          </Link>
          <button onClick={closeMobileMenu} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Cerrar menú">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href} onClick={handleNavigation} className={cn('sidebar-link', isActive && 'sidebar-link-active')}>
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );

  return <>{desktopSidebar}{mobileDrawer}</>;
}
