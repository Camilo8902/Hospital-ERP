'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  UserCog,
  FlaskConical,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // DEBUG: Log del rol que llega
  useEffect(() => {
    console.log('=== SIDEBAR DEBUG ===');
    console.log('userRole recibido:', userRole, 'tipo:', typeof userRole);
    console.log('userName:', userName);
    console.log('navigationConfig:', navigationConfig.map(n => ({ name: n.name, roles: n.roles })));
  }, [userRole, userName]);

  const navigation = navigationConfig.filter((item) => {
    const included = item.roles.includes(userRole as string);
    console.log(`Ruta "${item.name}": roles=${JSON.stringify(item.roles)}, userRole=${userRole}, included=${included}`);
    return included;
  });

  console.log('navigation filtrada:', navigation.map(n => n.name));

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error al cerrar sesion:', error.message);
        alert('Error al cerrar sesion. Por favor, intenta de nuevo.');
        setIsLoggingOut(false);
        return;
      }

      window.location.href = '/login';
    } catch (error) {
      console.error('Error inesperado al cerrar sesion:', error);
      alert('Ocurrio un error inesperado. Por favor, intenta de nuevo.');
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900">MediCore</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <Menu className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-link w-full text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesion</span>}
        </button>
      </div>
    </aside>
  );
}
