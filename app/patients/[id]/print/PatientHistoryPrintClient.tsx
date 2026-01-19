'use client';

import { useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import type { Patient, MedicalRecord, Appointment, Prescription, PatientNote, LabOrder } from '@/lib/types';

interface EnrichedMedicalRecord extends MedicalRecord {
  profiles?: {
    full_name: string;
    specialty?: string;
  };
}

interface EnrichedAppointment extends Appointment {
  departments?: {
    name: string;
  };
}

interface PatientHistoryPrintClientProps {
  patient: Patient;
  medicalRecords: EnrichedMedicalRecord[];
  appointments: EnrichedAppointment[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  patientNotes: PatientNote[];
}

// Utilidad para calcular edad
function calculateAge(dob: string | undefined): string {
  if (!dob) return 'No especificada';
  try {
    const date = new Date(dob);
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
function getGenderLabel(gender: string | null | undefined): string {
  if (!gender) return 'No especificado';
  const labels: Record<string, string> = {
    'male': 'Masculino',
    'female': 'Femenino',
    'other': 'Otro',
    'prefer_not_to_say': 'Prefiere no decir',
  };
  return labels[gender] || gender;
}

export default function PatientHistoryPrintClient({
  patient,
  medicalRecords,
  appointments,
  prescriptions,
  labOrders,
  patientNotes,
}: PatientHistoryPrintClientProps) {

  // Imprimir automáticamente al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
          Imprimir Historia Clínica
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
        {/* Encabezado de impresión */}
        <div style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #2563eb' }}>
          <h1 style={{ fontSize: '16pt', color: '#1e40af', margin: '0 0 3px 0' }}>HISTORIA CLÍNICA</h1>
          <p style={{ fontSize: '9pt', color: '#6b7280', margin: '0' }}>Médicore ERP - Sistema de Gestión Hospitalaria</p>
        </div>

        {/* Datos del paciente */}
        <div style={{ marginBottom: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', width: '20%', color: '#64748b' }}>Nombre:</td>
                <td style={{ padding: '3px 0', width: '30%', fontWeight: 'bold' }}>{patient.first_name} {patient.last_name}</td>
                <td style={{ padding: '3px 0', width: '20%', color: '#64748b' }}>Fecha Nac.:</td>
                <td style={{ padding: '3px 0', width: '30%', fontWeight: 'bold' }}>{formatDate(patient.dob)} ({calculateAge(patient.dob)})</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#64748b' }}>Sexo:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{getGenderLabel(patient.gender ?? undefined)}</td>
                <td style={{ padding: '3px 0', color: '#64748b' }}>MRN:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.medical_record_number}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#64748b' }}>Teléfono:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.phone || 'No especificado'}</td>
                <td style={{ padding: '3px 0', color: '#64748b' }}>Email:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.email || 'No registrado'}</td>
              </tr>
              {patient.insurance_provider && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#64748b' }}>Seguro:</td>
                  <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.insurance_provider} {patient.insurance_policy_number && `- ${patient.insurance_policy_number}`}</td>
                  <td style={{ padding: '3px 0', color: '#64748b' }}>Tipo Sangre:</td>
                  <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.blood_type || 'No registrado'}</td>
                </tr>
              )}
              {patient.emergency_contact_name && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#64748b' }}>Contacto Emerg.:</td>
                  <td style={{ padding: '3px 0', fontWeight: 'bold' }}>{patient.emergency_contact_name} {patient.emergency_contact_phone && `- ${patient.emergency_contact_phone}`}</td>
                  <td style={{ padding: '3px 0' }}></td>
                  <td style={{ padding: '3px 0' }}></td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Alergias */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div style={{ backgroundColor: '#fef2f2', padding: '8px', border: '1px solid #fecaca', borderRadius: '4px', marginTop: '8px' }}>
              <strong style={{ color: '#dc2626' }}>ALERGIAS: </strong>
              <span>{patient.allergies.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Registro Clínico */}
        {medicalRecords.length > 0 && (
          <div style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>REGISTRO CLÍNICO</h3>
            {medicalRecords.map((record) => (
              <div key={record.id} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#1e40af' }}>
                      {record.record_type === 'consultation' ? 'CONSULTA' :
                       record.record_type === 'procedure' ? 'PROCEDIMIENTO' :
                       record.record_type === 'discharge' ? 'ALTA MÉDICA' :
                       record.record_type === 'progress_note' ? 'NOTA DE EVOLUCIÓN' :
                       record.record_type === 'referral' ? 'REFERENCIA' :
                       record.record_type === 'lab_result' ? 'RESULTADO DE LABORATORIO' :
                       record.record_type === 'imaging_result' ? 'RESULTADO DE IMAGEN' :
                       record.record_type?.toUpperCase()}
                    </span>
                    <span style={{ color: '#64748b', marginLeft: '8px' }}>{formatDate(record.visit_date)}</span>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    Dr. {record.profiles?.full_name || 'No especificado'}
                    {record.profiles?.specialty && ` (${record.profiles.specialty})`}
                  </div>
                </div>
                
                {record.chief_complaint && (
                  <p style={{ margin: '4px 0', fontSize: '9pt' }}><strong>Motivo:</strong> {record.chief_complaint}</p>
                )}
                
                {record.history_of_present_illness && (
                  <p style={{ margin: '4px 0', fontSize: '9pt' }}><strong>Enfermedad actual:</strong> {record.history_of_present_illness}</p>
                )}
                
                {record.physical_examination && (
                  <p style={{ margin: '4px 0', fontSize: '9pt' }}><strong>Exploración física:</strong> {record.physical_examination}</p>
                )}
                
                {record.diagnosis && record.diagnosis.length > 0 && (
                  <p style={{ margin: '4px 0', fontSize: '9pt' }}><strong>Diagnóstico:</strong> {record.diagnosis.join(', ')}</p>
                )}
                
                {record.treatment_plan && (
                  <p style={{ margin: '4px 0', fontSize: '9pt' }}><strong>Plan de tratamiento:</strong> {record.treatment_plan}</p>
                )}
                
                {record.notes && (
                  <p style={{ margin: '4px 0', fontSize: '9pt', color: '#64748b' }}><strong>Notas:</strong> {record.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recetas Médicas */}
        {prescriptions.length > 0 && (
          <div style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>RECETAS MÉDICAS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Medicamento</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Dosis</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Frecuencia</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Duración</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '4px 6px' }}>{formatDate(rx.created_at)}</td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{rx.medication_name}</td>
                    <td style={{ padding: '4px 6px' }}>{rx.dosage}</td>
                    <td style={{ padding: '4px 6px' }}>{rx.frequency}</td>
                    <td style={{ padding: '4px 6px' }}>{rx.duration}</td>
                    <td style={{ padding: '4px 6px' }}>
                      {rx.status === 'dispensed' ? 'Dispensado' :
                       rx.status === 'pending' ? 'Pendiente' :
                       rx.status === 'partially_dispensed' ? 'Parcial' :
                       rx.status === 'cancelled' ? 'Cancelado' :
                       rx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resultados de Laboratorio */}
        {labOrders.length > 0 && (
          <div style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>ÓRDENES DE LABORATORIO</h3>
            {labOrders.map((order) => (
              <div key={order.id} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Orden: {order.order_number}</span>
                  <span style={{ color: '#64748b' }}>{formatDate(order.created_at)}</span>
                </div>
                <div style={{ fontSize: '9pt' }}>
                  <strong>Pruebas:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {order.lab_order_details?.map((detail: any) => (
                      <li key={detail.id}>
                        {detail.tests?.name || detail.custom_name || 'Prueba personalizada'}
                        <span style={{ color: '#64748b', marginLeft: '4px' }}>
                          ({detail.tests?.category?.name || 'Sin categoría'})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    fontSize: '8pt', 
                    borderRadius: '4px',
                    backgroundColor: order.status === 'completed' ? '#dcfce7' : 
                                    order.status === 'processing' ? '#dbeafe' : 
                                    order.status === 'samples_collected' ? '#fef9c3' : 
                                    '#f3f4f6',
                    color: order.status === 'completed' ? '#166534' : 
                           order.status === 'processing' ? '#1e40af' : 
                           order.status === 'samples_collected' ? '#854d0e' : 
                           '#374151'
                  }}>
                    {order.status === 'completed' ? 'COMPLETADO' :
                     order.status === 'processing' ? 'EN PROCESO' :
                     order.status === 'samples_collected' ? 'MUESTRAS TOMADAS' :
                     order.status === 'pending' ? 'PENDIENTE' :
                     order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historial de Citas */}
        {appointments.length > 0 && (
          <div style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>HISTORIAL DE CITAS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Tipo</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Departamento</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '4px 6px' }}>{formatDate(apt.start_time)}</td>
                    <td style={{ padding: '4px 6px' }}>
                      {apt.appointment_type === 'consultation' ? 'Consulta' :
                       apt.appointment_type === 'follow_up' ? 'Seguimiento' :
                       apt.appointment_type === 'emergency' ? 'Emergencia' :
                       apt.appointment_type === 'procedure' ? 'Procedimiento' :
                       apt.appointment_type === 'imaging' ? 'Imagen' :
                       apt.appointment_type === 'laboratory' ? 'Laboratorio' :
                       apt.appointment_type === 'surgery' ? 'Cirugía' :
                       apt.appointment_type}
                    </td>
                    <td style={{ padding: '4px 6px' }}>{apt.departments?.name || 'N/A'}</td>
                    <td style={{ padding: '4px 6px' }}>
                      {apt.status === 'completed' ? 'Completada' :
                       apt.status === 'in_progress' ? 'En Progreso' :
                       apt.status === 'cancelled' ? 'Cancelada' :
                       apt.status === 'no_show' ? 'No Asistió' :
                       apt.status === 'scheduled' ? 'Programada' :
                       apt.status}
                    </td>
                    <td style={{ padding: '4px 6px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Anotaciones */}
        {patientNotes.length > 0 && (
          <div style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>ANOTACIONES</h3>
            {patientNotes.map((note) => (
              <div key={note.id} style={{ marginBottom: '6px', paddingLeft: '8px', borderLeft: '3px solid #3b82f6', pageBreakInside: 'avoid' }}>
                <div style={{ fontSize: '9pt' }}>
                  <strong>{note.author_name}</strong>
                  <span style={{ color: '#64748b', marginLeft: '8px' }}>
                    {formatDate(note.created_at, 'dd/MM/yyyy')} a las {new Date(note.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '9pt' }}>{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pie de página */}
        <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', fontSize: '7pt', color: '#64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Historia Clínica Confidencial - Generado por Médicore ERP</span>
            <span>Fecha de impresión: {formatDate(new Date().toISOString(), 'dd/MM/yyyy')}</span>
          </div>
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
            background-color: white;
            min-height: 100vh;
          }
          
          body {
            background-color: #f3f4f6;
          }
        }
      `}</style>
    </>
  );
}
