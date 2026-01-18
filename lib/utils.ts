import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear fecha para display
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: es });
}

// Formatear fecha con hora
export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

// Formatear solo hora
export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: es });
}

// Formatear fecha relativa (hace 2 horas, etc.)
export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

// Obtener etiqueta de fecha (Hoy, Mañana, fecha)
export function getDateLabel(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

// Formatear currency
export function formatCurrency(amount: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Formatear teléfono
export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
  if (match) {
    return `+52 ${match[1]} ${match[2]}-${match[3]}`;
  }
  return phone;
}

// Capitalizar primera letra
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Obtener iniciales
export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Truncar texto
export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Obtener color por estado de cita
export function getAppointmentStatusColor(status: string) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Obtener color por estado de factura
export function getInvoiceStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Obtener etiqueta de rol
export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    doctor: 'Médico',
    nurse: 'Enfermero',
    reception: 'Recepción',
    pharmacy: 'Farmacia',
  };
  return labels[role] || role;
}

// Obtener color por rol
export function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    doctor: 'bg-blue-100 text-blue-800',
    nurse: 'bg-green-100 text-green-800',
    reception: 'bg-yellow-100 text-yellow-800',
    pharmacy: 'bg-orange-100 text-orange-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Calcular edad desde fecha de nacimiento
export function calculateAge(dob: string) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Validar email
export function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generar colores aleatorios para gráficos
export function generateChartColors(count: number) {
  const baseColors = [
    '#0ea5e9', // sky blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  
  return baseColors.slice(0, count);
}
