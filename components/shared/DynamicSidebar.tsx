'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  UserCog,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMobileMenu } from './MobileMenuContext';
import { getDepartmentsForSidebar, DepartmentWithAccess } from '@/lib/actions/departments';
import { 
  Activity, 
  Scan, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Baby, 
  Siren, 
  Heart, 
  Building 
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  userName: string;
}

// Iconos estáticos para módulos institucionales
const staticModules = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'nurse', 'reception', 'pharmacy', 'lab'],
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
];

// Módulos de departamentos hardcodeados (Farmacia y Laboratorio)
const departmentModules = [
  {
    name: 'Farmacia',
    href: '/dashboard/pharmacy',
    icon: Pill,
    roles: ['admin', 'pharmacy'],
  },
  {
    name: 'Laboratorio',
    href: '/dashboard/lab',
    icon: FlaskConical,
    roles: ['admin', 'lab', 'lab_admin'],
  },
];

// Módulos administrativos (Usuarios y Configuración)
const adminModules = [
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    name: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

// Iconos para departamentos
const departmentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Scan,
  Stethoscope,
  Pill,
  FlaskConical,
  Baby,
  Siren,
  Heart,
  Building,
  Building2,
};

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [departments, setDepartments] = useState<DepartmentWithAccess[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsExpanded, setDepartmentsExpanded] = useState(false);
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

  // Optimización: Cargar departamentos solo una vez y cuando sea necesario
  useEffect(() => {
    let mounted = true;

    const loadDepartments = async () => {
      // Skip si ya tenemos datos cargados
      if (departments.length > 0 && !isLoadingDepartments) {
        return;
      }

      try {
        const depts = await getDepartmentsForSidebar(userRole);
        if (mounted) {
          setDepartments(depts);
        }
      } catch (error) {
        console.error('Error loading departments:', error);
      } finally {
        if (mounted) {
          setIsLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      mounted = false;
    };
  }, [userRole, departments.length, isLoadingDepartments]);

  // Filtrar módulos estáticos por rol
  const visibleStaticModules = staticModules.filter((item) =>
    item.roles.includes(userRole as string)
  );

  // Filtrar módulos de departamentos hardcodeados por rol
  const visibleDepartmentModules = departmentModules.filter((item) =>
    item.roles.includes(userRole as string)
  );

  // Filtrar módulos administrativos por rol
  const visibleAdminModules = adminModules.filter((item) =>
    item.roles.includes(userRole as string)
  );

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

  const renderNavItem = (
    item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> },
    isActive: boolean,
    isCollapsed: boolean
  ) => (
    <Link
      key={item.name}
      href={item.href}
      onClick={handleNavigation}
      className={cn(
        'sidebar-link',
        isActive && 'sidebar-link-active',
        isCollapsed && 'justify-center px-2 lg:px-1'
      )}
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );

  const renderDepartmentItem = (dept: DepartmentWithAccess, isCollapsed: boolean) => {
    const IconComponent = departmentIcons[dept.icon || ''] || Building2;
    const isActive = pathname === dept.href || pathname.startsWith(dept.href + '/');

    return (
      <Link
        key={dept.id}
        href={dept.href}
        onClick={handleNavigation}
        className={cn(
          'sidebar-link',
          isActive && 'sidebar-link-active',
          isCollapsed && 'justify-center px-2 lg:px-1'
        )}
        title={isCollapsed ? dept.name : undefined}
      >
        <IconComponent className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
        {!isCollapsed && <span className="truncate">{dept.name}</span>}
      </Link>
    );
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? (
            <Menu className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className={cn('w-5 h-5 text-gray-600 transition-transform', collapsed && 'rotate-180')} />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Módulos estáticos: Dashboard, Pacientes, Citas */}
        {visibleStaticModules.map((item) =>
          renderNavItem(item, pathname === item.href || pathname.startsWith(item.href + '/'), collapsed)
        )}

        {/* Módulo desplegable de Departamentos */}
        {departments.length > 0 && (
          <div className="space-y-1">
            {/* Header del módulo Departamentos */}
            <button
              onClick={() => setDepartmentsExpanded(!departmentsExpanded)}
              className={cn(
                'sidebar-link w-full',
                (pathname.startsWith('/dashboard/departments/') ||
                  departments.some(d => pathname.startsWith(d.href))) && 'sidebar-link-active',
                collapsed && 'justify-center px-2 lg:px-1'
              )}
              title={collapsed ? 'Departamentos' : undefined}
            >
              <Building2 className={cn(
                'w-5 h-5 flex-shrink-0',
                (pathname.startsWith('/dashboard/departments/') ||
                  departments.some(d => pathname.startsWith(d.href))) && 'text-primary-600'
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">Departamentos</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform flex-shrink-0',
                      departmentsExpanded && 'rotate-180'
                    )}
                  />
                </>
              )}
            </button>

            {/* Lista de departamentos (expandible) */}
            {departmentsExpanded && !collapsed && (
              <div className="ml-4 space-y-1 border-l-2 border-gray-100 pl-3 mt-1">
                {isLoadingDepartments ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  departments.map((dept) => renderDepartmentItem(dept, false))
                )}
              </div>
            )}
          </div>
        )}

        {/* Separador antes de Departamentos hardcodeados */}
        {visibleDepartmentModules.length > 0 && (
          <div className="my-3 border-t border-gray-200" />
        )}

        {/* Departamentos hardcodeados: Farmacia, Laboratorio */}
        {visibleDepartmentModules.map((item) =>
          renderNavItem(item, pathname === item.href || pathname.startsWith(item.href + '/'), collapsed)
        )}

        {/* Punto de Venta de Farmacia (solo para roles de pharmacy/admin) */}
        {(userRole === 'pharmacy' || userRole === 'admin') && (
          <Link
            href="/dashboard/pharmacy/pos"
            onClick={handleNavigation}
            className={cn(
              'sidebar-link',
              pathname === '/dashboard/pharmacy/pos' && 'sidebar-link-active',
              collapsed && 'justify-center px-2 lg:px-1'
            )}
            title={collapsed ? 'Punto de Venta' : undefined}
          >
            <ShoppingCart className={cn('w-5 h-5 flex-shrink-0', pathname === '/dashboard/pharmacy/pos' && 'text-primary-600')} />
            {!collapsed && <span className="truncate">Punto de Venta</span>}
          </Link>
        )}

        {/* Separador antes de módulos administrativos */}
        {(visibleDepartmentModules.length > 0 || (userRole === 'pharmacy' || userRole === 'admin')) && visibleAdminModules.length > 0 && (
          <div className="my-3 border-t border-gray-200" />
        )}

        {/* Módulos administrativos: Usuarios, Configuración */}
        {visibleAdminModules.map((item) =>
          renderNavItem(item, pathname === item.href || pathname.startsWith(item.href + '/'), collapsed)
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-link w-full text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed && 'justify-center px-2 lg:px-1'
          )}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );

  const mobileDrawer = (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 lg:hidden transform transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavigation}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Módulos estáticos: Dashboard, Pacientes, Citas */}
          <div className="p-3 space-y-1">
            {visibleStaticModules.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Módulo desplegable de Departamentos (Mobile) */}
          {departments.length > 0 && (
            <div className="p-3 space-y-1">
              <button
                onClick={() => setDepartmentsExpanded(!departmentsExpanded)}
                className={cn(
                  'sidebar-link w-full',
                  (pathname.startsWith('/dashboard/departments/') ||
                    departments.some(d => pathname.startsWith(d.href))) && 'sidebar-link-active'
                )}
              >
                <Building2 className={cn(
                  'w-5 h-5 flex-shrink-0',
                  (pathname.startsWith('/dashboard/departments/') ||
                    departments.some(d => pathname.startsWith(d.href))) && 'text-primary-600'
                )} />
                <span className="flex-1 text-left">Departamentos</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    departmentsExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Lista de departamentos (expandible) */}
              {departmentsExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-100 pl-3 mt-1">
                  {isLoadingDepartments ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando...</span>
                    </div>
                  ) : (
                    departments.map((dept) => {
                      const IconComponent = departmentIcons[dept.icon || ''] || Building2;
                      const isActive = pathname === dept.href || pathname.startsWith(dept.href + '/');
                      return (
                        <Link
                          key={dept.id}
                          href={dept.href}
                          onClick={handleNavigation}
                          className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                        >
                          <IconComponent className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
                          <span>{dept.name}</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Separador antes de Departamentos hardcodeados */}
          {visibleDepartmentModules.length > 0 && (
            <div className="mx-3 border-t border-gray-200" />
          )}

          {/* Departamentos hardcodeados: Farmacia, Laboratorio */}
          <div className="p-3 space-y-1">
            {visibleDepartmentModules.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Punto de Venta de Farmacia */}
          {(userRole === 'pharmacy' || userRole === 'admin') && (
            <div className="p-3 space-y-1">
              <Link
                href="/dashboard/pharmacy/pos"
                onClick={handleNavigation}
                className={cn('sidebar-link', pathname === '/dashboard/pharmacy/pos' && 'sidebar-link-active')}
              >
                <ShoppingCart className={cn('w-5 h-5 flex-shrink-0', pathname === '/dashboard/pharmacy/pos' && 'text-primary-600')} />
                <span>Punto de Venta</span>
              </Link>
            </div>
          )}

          {/* Separador antes de módulos administrativos */}
          {(visibleDepartmentModules.length > 0 || (userRole === 'pharmacy' || userRole === 'admin')) && visibleAdminModules.length > 0 && (
            <div className="mx-3 border-t border-gray-200" />
          )}

          {/* Módulos administrativos: Usuarios, Configuración */}
          <div className="p-3 space-y-1">
            {visibleAdminModules.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                >
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );

  return <>{desktopSidebar}{mobileDrawer}</>;
}
