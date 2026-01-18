'use client';

import { useState, useEffect } from 'react';
import { getLabOrderById } from '@/lib/actions/lab';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { LabTestParameter, LabOrderResult, LabOrderDetail } from '@/lib/types';
import type { LabOrder } from '@/lib/types';
import type { Profile } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LabOrderDetailWithTest extends LabOrderDetail {
  tests?: {
    id: string;
    code: string;
    name: string;
    category?: { name: string };
    lab_parameters?: LabTestParameter[];
    parameters?: LabTestParameter[];
  };
  lab_results?: LabOrderResult[];
}

// Utilidad para calcular edad
function calculateAge(birthDate: string | undefined): string {
  if (!birthDate) return 'No especificada';
  try {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return 'No especificada';
    
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    if (age < 0 || age > 150) return 'No especificada';
    return `${age} años`;
  } catch {
    return 'No especificada';
  }
}

// Utilidad para obtener etiqueta de género
function getGenderLabel(gender: string | undefined): string {
  if (!gender) return 'No especificado';
  const labels: Record<string, string> = {
    'male': 'Masculino',
    'female': 'Femenino',
    'other': 'Otro',
    'prefer_not_to_say': 'Prefiere no decir',
  };
  return labels[gender] || gender;
}

function isValueAbnormal(param: LabTestParameter, value: string): boolean {
  if (!value) return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const refMin = (param as unknown as Record<string, string | null>).reference_min ?? param.ref_range_min;
  const refMax = (param as unknown as Record<string, string | null>).reference_max ?? param.ref_range_max;
  
  if (refMin !== null && refMin !== undefined && numValue < Number(refMin)) return true;
  if (refMax !== null && refMax !== undefined && numValue > Number(refMax)) return true;
  
  return false;
}

function isValueCritical(param: LabTestParameter, value: string): boolean {
  if (!value) return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const criticalBelow = (param as unknown as Record<string, string | null>).is_critical_below ?? param.critical_min;
  const criticalAbove = (param as unknown as Record<string, string | null>).is_critical_above ?? param.critical_max;
  
  if (criticalBelow !== null && criticalBelow !== undefined && numValue < Number(criticalBelow)) return true;
  if (criticalAbove !== null && criticalAbove !== undefined && numValue > Number(criticalAbove)) return true;
  
  return false;
}

function getDetails(order: LabOrder): LabOrderDetailWithTest[] {
  if (order.lab_order_details && Array.isArray(order.lab_order_details)) {
    return order.lab_order_details as unknown as LabOrderDetailWithTest[];
  }
  return [];
}

export default function LabOrderPrintPage({ params }: PageProps) {
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [completedByProfile, setCompletedByProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/lab/orders/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Orden no encontrada');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la orden');
      } finally {
        setLoading(false);
      }
    }
    
    loadOrder();
  }, [params]);

  // Obtener el perfil del usuario que completó la orden
  useEffect(() => {
    if (order?.completed_by) {
      async function fetchCompletedByProfile() {
        try {
          const response = await fetch(`/api/users/${order.completed_by}`);
          if (response.ok) {
            const profile = await response.json();
            setCompletedByProfile(profile);
          }
        } catch (err) {
          console.error('Error al obtener perfil del responsable:', err);
        }
      }
      fetchCompletedByProfile();
    }
  }, [order?.completed_by]);

  // Imprimir automáticamente al cargar
  useEffect(() => {
    if (order && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: 'red'
      }}>
        <p>{error || 'Orden no encontrada'}</p>
      </div>
    );
  }

  const details = getDetails(order);

  return (
    <>
      {/* Botón flotante para imprimir - visible solo en pantalla */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }} className="print-hide">
        <button
          onClick={() => window.print()}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Imprimir Resultados
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
      </div>

      {/* Contenido imprimible */}
      <div id="print-content">
        {/* Header de impresión */}
        <div style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #2563eb' }}>
          <h1 style={{ fontSize: '16pt', color: '#1e40af', margin: '0 0 3px 0' }}>RESULTADOS DE LABORATORIO</h1>
          <p style={{ fontSize: '9pt', color: '#6b7280', margin: '0' }}>Medicore ERP - Sistema de Gestión de Laboratorio</p>
        </div>

        {/* Info de la orden */}
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Orden: {order.order_number}</span>
            <span style={{ color: '#64748b' }}>Fecha: {formatDateTime(order.created_at)}</span>
          </div>
        </div>

        {/* Datos del paciente */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: 'bold', color: '#334155', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>DATOS DEL PACIENTE</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', width: '20%', color: '#64748b' }}>Nombre:</td>
                <td style={{ padding: '2px 0', width: '30%', fontWeight: 'bold' }}>{order.patients?.first_name} {order.patients?.last_name}</td>
                <td style={{ padding: '2px 0', width: '20%', color: '#64748b' }}>Fecha Nac.:</td>
                <td style={{ padding: '2px 0', width: '30%', fontWeight: 'bold' }}>{order.patients?.dob ? formatDate(order.patients.dob) : 'No especificada'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#64748b' }}>Edad:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{calculateAge(order.patients?.dob)}</td>
                <td style={{ padding: '2px 0', color: '#64748b' }}>Sexo:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{getGenderLabel(order.patients?.gender)}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#64748b' }}>Teléfono:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{order.patients?.phone || 'No especificado'}</td>
                <td style={{ padding: '2px 0', color: '#64748b' }}>Doctor:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{order.profiles?.full_name || 'No especificado'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resultados */}
        {details.map((detailItem) => {
          const test = detailItem.tests;
          if (!test) return null;
          
          const parameters = test.lab_parameters || [];

          return (
            <div key={detailItem.id} style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
              <div style={{ backgroundColor: '#e2e8f0', padding: '6px 8px', border: '1px solid #94a3b8', borderBottom: 'none' }}>
                <h3 style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1e293b', margin: '0' }}>{test.name}</h3>
                <p style={{ fontSize: '8pt', color: '#64748b', margin: '2px 0 0 0' }}>
                  {test.category?.name || 'Sin categoría'} • Código: {test.code || 'N/A'}
                </p>
              </div>
              
              {parameters.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', fontSize: '8pt' }}>Parámetro</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', width: '80px', fontSize: '8pt' }}>Resultado</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', width: '60px', fontSize: '8pt' }}>Unidad</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', width: '90px', fontSize: '8pt' }}>Rango Ref.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((param) => {
                      const value = detailItem.lab_results?.find(r => r.parameter_id === param.id)?.value_text || '';
                      const isAbnormal = isValueAbnormal(param, value);
                      const isCritical = isValueCritical(param, value);
                      
                      let refRangeText = '';
                      if (param.reference_text) {
                        refRangeText = param.reference_text;
                      } else if (param.ref_range_min !== null || param.ref_range_max !== null) {
                        refRangeText = `${param.ref_range_min ?? '-'} - ${param.ref_range_max ?? '-'}`;
                      }

                      return (
                        <tr key={param.id} style={{ backgroundColor: isCritical ? '#fef2f2' : isAbnormal ? '#fefce8' : '#ffffff' }}>
                          <td style={{ padding: '4px 6px', borderBottom: '1px solid #cbd5e1', fontSize: '9pt' }}>{param.name}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontWeight: isCritical || isAbnormal ? 'bold' : 'normal', color: isCritical ? '#dc2626' : isAbnormal ? '#a16207' : 'inherit', fontSize: '9pt' }}>
                            {value || '-'}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', color: '#64748b', fontSize: '8pt' }}>{param.unit || '-'}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontSize: '8pt' }}>{refRangeText || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f9fafb', fontSize: '9pt' }}>
                  <span style={{ color: '#6b7280' }}>Resultado: </span>
                  <strong>{detailItem.lab_results?.[0]?.value_text || '-'}</strong>
                </div>
              )}

              {(detailItem.notes) && (
                <div style={{ padding: '6px 8px', backgroundColor: '#fafafa', border: '1px solid #e2e8f0', borderTop: 'none', fontSize: '8pt' }}>
                  <strong style={{ color: '#6b7280' }}>Notas:</strong> {detailItem.notes}
                </div>
              )}
            </div>
          );
        })}

        {/* Firmas */}
        <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '180px', borderTop: '1px solid #000', marginTop: '40px', paddingTop: '3px', fontSize: '9pt' }}>
                {completedByProfile?.full_name && (
                  <div style={{ fontSize: '9pt', marginBottom: '2px' }}>
                    {completedByProfile.full_name}
                  </div>
                )}
                Responsable del Laboratorio
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '180px', borderTop: '1px solid #000', marginTop: '40px', paddingTop: '3px', fontSize: '9pt' }}>Médico Tratante</div>
            </div>
          </div>
          <p style={{ fontSize: '7pt', color: '#64748b', textAlign: 'center', marginTop: '15px' }}>
            Este documento es un comprobante oficial de resultados de laboratorio
          </p>
          <p style={{ fontSize: '7pt', color: '#64748b', textAlign: 'center', margin: '3px 0 0 0' }}>
            Generado: {formatDateTime(new Date().toISOString())}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: letter;
          }
          
          * {
            visibility: hidden;
          }
          
          #print-content,
          #print-content * {
            visibility: visible;
          }
          
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          
          .print-hide {
            display: none !important;
          }
          
          #print-content {
            display: block !important;
          }
        }
        
        @media screen {
          #print-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          body {
            background-color: #f3f4f6;
          }
        }
      `}</style>
    </>
  );
}
