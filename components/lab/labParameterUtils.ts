import type { LabTestParameter, LabTestCatalog } from '@/lib/types';

/**
 * Tipo extendido que incluye ambos nombres de campos para parámetros
 */
export interface ExtendedLabTestParameter extends LabTestParameter {
  lab_parameters?: LabTestParameter[];
  parameters?: LabTestParameter[];
}

/**
 * Tipo extendido para el catálogo de pruebas
 */
export interface ExtendedLabTestCatalog extends LabTestCatalog {
  lab_parameters?: LabTestParameter[];
  parameters?: LabTestParameter[];
}

/**
 * Obtiene los parámetros de una prueba, verificando ambos posibles nombres de campo
 */
export function getTestParameters(test: ExtendedLabTestCatalog | undefined): LabTestParameter[] {
  if (!test) return [];
  return test.lab_parameters || test.parameters || [];
}

/**
 * Verifica si un valor está fuera del rango de referencia
 */
export function isValueAbnormal(
  param: LabTestParameter, 
  value: string
): boolean {
  if (!value) return false;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  // Intentar obtener el valor mínimo de referencia
  let refMin: number | null | undefined;
  let refMax: number | null | undefined;
  
  // reference_min/max del schema del usuario
  const paramRecord = param as unknown as Record<string, string | number | null | undefined>;
  if (paramRecord.reference_min !== undefined) {
    const minVal = paramRecord.reference_min;
    refMin = minVal !== null && minVal !== undefined ? Number(minVal) : null;
  } else if (param.ref_range_min !== undefined) {
    refMin = param.ref_range_min;
  }
  
  // reference_max del schema del usuario
  if (paramRecord.reference_max !== undefined) {
    const maxVal = paramRecord.reference_max;
    refMax = maxVal !== null && maxVal !== undefined ? Number(maxVal) : null;
  } else if (param.ref_range_max !== undefined) {
    refMax = param.ref_range_max;
  }
  
  if (refMin !== null && refMin !== undefined && numValue < refMin) return true;
  if (refMax !== null && refMax !== undefined && numValue > refMax) return true;
  
  return false;
}

/**
 * Verifica si un valor es crítico según los umbrales definidos
 */
export function isValueCritical(
  param: LabTestParameter, 
  value: string
): boolean {
  if (!value) return false;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  // Intentar obtener los umbrales críticos
  let criticalBelow: number | null | undefined;
  let criticalAbove: number | null | undefined;
  
  // is_critical_below del schema del usuario
  const paramRecord = param as unknown as Record<string, string | number | null | undefined>;
  if (paramRecord.is_critical_below !== undefined) {
    const val = paramRecord.is_critical_below;
    criticalBelow = val !== null && val !== undefined ? Number(val) : null;
  } else if (param.critical_min !== undefined) {
    criticalBelow = param.critical_min;
  }
  
  // is_critical_above del schema del usuario
  if (paramRecord.is_critical_above !== undefined) {
    const val = paramRecord.is_critical_above;
    criticalAbove = val !== null && val !== undefined ? Number(val) : null;
  } else if (param.critical_max !== undefined) {
    criticalAbove = param.critical_max;
  }
  
  if (criticalBelow !== null && criticalBelow !== undefined && numValue < criticalBelow) return true;
  if (criticalAbove !== null && criticalAbove !== undefined && numValue > criticalAbove) return true;
  
  return false;
}

/**
 * Obtiene el texto de rango de referencia formateado
 */
export function getReferenceRangeText(param: LabTestParameter): string {
  // reference_text del schema del usuario
  const paramRecord = param as unknown as Record<string, string | number | null | undefined>;
  if (paramRecord.reference_text) {
    return paramRecord.reference_text as string;
  }
  
  if (param.ref_range_text) {
    return param.ref_range_text;
  }
  
  // reference_min/max del schema del usuario
  let refMin: string | number | null | undefined;
  let refMax: string | number | null | undefined;
  
  if (paramRecord.reference_min !== undefined) {
    refMin = paramRecord.reference_min;
  } else if (param.ref_range_min !== undefined) {
    refMin = param.ref_range_min;
  }
  
  if (paramRecord.reference_max !== undefined) {
    refMax = paramRecord.reference_max;
  } else if (param.ref_range_max !== undefined) {
    refMax = param.ref_range_max;
  }
  
  if (refMin !== null && refMin !== undefined && refMax !== null && refMax !== undefined) {
    return `${refMin} - ${refMax}`;
  }
  
  if (refMin !== null && refMin !== undefined) {
    return `> ${refMin}`;
  }
  
  if (refMax !== null && refMax !== undefined) {
    return `< ${refMax}`;
  }
  
  return '';
}

/**
 * Obtiene el orden de visualización de un parámetro
 */
export function getParameterSortOrder(param: LabTestParameter): number {
  // order_index del schema del usuario
  const paramRecord = param as unknown as Record<string, number | undefined>;
  if (paramRecord.order_index !== undefined) {
    return paramRecord.order_index;
  }
  
  return param.sort_order || 0;
}
