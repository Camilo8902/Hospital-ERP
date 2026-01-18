'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Stethoscope,
  Pill,
  AlertCircle,
  ClipboardList,
  Clock,
  Printer,
  Edit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDate, formatDateTime, getInitials } from '@/lib/utils';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  blood_type: string | null;
  allergies: string[] | null;
}

interface ClinicalRecord {
  id: string;
  visit_date: string;
  record_type: string;
  chief_complaint: string | null;
  chief_complaint_duration: string | null;
  history_of_present_illness: string | null;
  review_of_systems: any | null;
  physical_examination: string | null;
  vital_signs: any | null;
  assessment_notes: string | null;
  diagnosis: any[] | null;
  treatment_plan: string | null;
  recommendations: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  notes: string | null;
  private_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    specialty: string | null;
  } | null;
}

export default function ClinicalRecordDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const recordId = params.recordId as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Secciones colapsables
  const [expandedSections, setExpandedSections] = useState({
    chiefComplaint: true,
    reviewOfSystems: false,
    physicalExam: true,
    vitalSigns: true,
    diagnosis: true,
    treatment: true,
    notes: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar paciente
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        if (!patientResponse.ok) throw new Error('Error al cargar paciente');
        const patientData = await patientResponse.json();
        setPatient(patientData.patient);

        // Cargar registro clínico
        // Buscar en todos los registros del paciente
        const historyResponse = await fetch(`/api/clinical-records/patient/${patientId}`);
        if (!historyResponse.ok) throw new Error('Error al cargar historial');
        const historyData = await historyResponse.json();
        
        const foundRecord = historyData.records?.find((r: ClinicalRecord) => r.id === recordId);
        if (!foundRecord) throw new Error('Registro clínico no encontrado');
        
        setRecord(foundRecord);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (patientId && recordId) {
      loadData();
    }
  }, [patientId, recordId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">{error}</p>
        <Link href={`/dashboard/patients/${patientId}/history`} className="btn-primary mt-4">
          Volver al Historial
        </Link>
      </div>
    );
  }

  if (!patient || !record) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Registro no encontrado</p>
        <Link href={`/dashboard/patients/${patientId}/history`} className="btn-primary mt-4">
          Volver al Historial
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/patients/${patientId}/history`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Historia Clínica</h1>
            <p className="text-gray-500 mt-1">
              {formatDateTime(record.visit_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <Link
            href={`/dashboard/patients/${patientId}/history/${recordId}/edit`}
            className="btn-primary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Información del paciente */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {getInitials(`${patient.first_name} ${patient.last_name}`)}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Edad</p>
                <p className="font-medium">{calculateAge(patient.dob)} años</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Sangre</p>
                <p className="font-medium">{patient.blood_type || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Médico</p>
                <p className="font-medium">
                  {record.profiles ? `Dr. ${record.profiles.full_name}` : 'No asignado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signos Vitales */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('vitalSigns')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Signos Vitales</h2>
          </div>
          {expandedSections.vitalSigns ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.vitalSigns && record.vital_signs && (
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {record.vital_signs.blood_pressure_systolic && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Presión Arterial</p>
                  <p className="font-semibold text-lg">
                    {record.vital_signs.blood_pressure_systolic}/{record.vital_signs.blood_pressure_diastolic} mmHg
                  </p>
                </div>
              )}
              {record.vital_signs.heart_rate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Frecuencia Cardíaca</p>
                  <p className="font-semibold text-lg">{record.vital_signs.heart_rate} ppm</p>
                </div>
              )}
              {record.vital_signs.respiratory_rate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Frecuencia Respiratoria</p>
                  <p className="font-semibold text-lg">{record.vital_signs.respiratory_rate} rpm</p>
                </div>
              )}
              {record.vital_signs.temperature && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Temperatura</p>
                  <p className="font-semibold text-lg">{record.vital_signs.temperature}°C</p>
                </div>
              )}
              {record.vital_signs.oxygen_saturation && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Saturación O₂</p>
                  <p className="font-semibold text-lg">{record.vital_signs.oxygen_saturation}%</p>
                </div>
              )}
              {record.vital_signs.weight && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Peso</p>
                  <p className="font-semibold text-lg">{record.vital_signs.weight} kg</p>
                </div>
              )}
              {record.vital_signs.height && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Altura</p>
                  <p className="font-semibold text-lg">{record.vital_signs.height} cm</p>
                </div>
              )}
              {record.vital_signs.bmi && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">BMI</p>
                  <p className="font-semibold text-lg">{record.vital_signs.bmi}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Motivo de Consulta */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('chiefComplaint')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Motivo de Consulta</h2>
          </div>
          {expandedSections.chiefComplaint ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.chiefComplaint && (
          <div className="card-body space-y-4">
            {record.chief_complaint && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Motivo</p>
                <p className="font-medium">{record.chief_complaint}</p>
              </div>
            )}
            {record.chief_complaint_duration && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Duración</p>
                <p className="font-medium">{record.chief_complaint_duration}</p>
              </div>
            )}
            {record.history_of_present_illness && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Historia de la Enfermedad Actual</p>
                <p className="whitespace-pre-wrap">{record.history_of_present_illness}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exploración Física */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('physicalExam')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Exploración Física</h2>
          </div>
          {expandedSections.physicalExam ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.physicalExam && (
          <div className="card-body">
            <p className="whitespace-pre-wrap">
              {record.physical_examination || 'No se registraron hallazgos de exploración física'}
            </p>
          </div>
        )}
      </div>

      {/* Diagnóstico */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('diagnosis')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Diagnóstico</h2>
          </div>
          {expandedSections.diagnosis ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.diagnosis && (
          <div className="card-body space-y-4">
            {record.diagnosis && record.diagnosis.length > 0 ? (
              <div className="space-y-2">
                {record.diagnosis.map((dx: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${
                        dx.type === 'primary' ? 'badge-danger' :
                        dx.type === 'secondary' ? 'badge-warning' :
                        'badge-gray'
                      }`}>
                        {dx.type === 'primary' ? 'Primario' :
                         dx.type === 'secondary' ? 'Secundario' :
                         dx.type === 'rule_out' ? 'Rule Out' : 'Final'}
                      </span>
                      <span className="font-mono font-bold">{dx.code}</span>
                    </div>
                    <p>{dx.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No se registraron diagnósticos</p>
            )}
            
            {record.assessment_notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notas de Evaluación</p>
                <p className="whitespace-pre-wrap">{record.assessment_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan de Tratamiento */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('treatment')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Plan de Tratamiento</h2>
          </div>
          {expandedSections.treatment ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.treatment && (
          <div className="card-body space-y-4">
            {record.treatment_plan && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Plan de Tratamiento</p>
                <p className="whitespace-pre-wrap">{record.treatment_plan}</p>
              </div>
            )}
            
            {record.recommendations && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Recomendaciones</p>
                <p className="whitespace-pre-wrap">{record.recommendations}</p>
              </div>
            )}
            
            {record.follow_up_required && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Requiere seguimiento: {record.follow_up_date ? formatDate(record.follow_up_date) : 'Sin fecha programada'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('notes')}
          className="card-header w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notas Adicionales</h2>
          </div>
          {expandedSections.notes ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.notes && (
          <div className="card-body space-y-4">
            {record.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notas Generales</p>
                <p className="whitespace-pre-wrap">{record.notes}</p>
              </div>
            )}
            
            {record.private_notes && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-1 font-medium">Notas Privadas</p>
                <p className="whitespace-pre-wrap text-amber-900">{record.private_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Registro creado el {formatDateTime(record.created_at)}</p>
      </div>
    </div>
  );
}
