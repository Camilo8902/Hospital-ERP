'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  User,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function EditPhysioEvaluationForm() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const evaluationId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    chief_complaint: '',
    pain_location: '',
    pain_duration: '',
    pain_type: '',
    pain_scale_baseline: 0,
    pain_characteristics: '',
    surgical_history: '',
    traumatic_history: '',
    medical_history: '',
    family_history: '',
    allergies: '',
    contraindications: '',
    postural_evaluation: '',
    physical_examination: '',
    neurological_screening: '',
    special_tests: '',
    clinical_diagnosis: '',
    functional_limitations: '',
    short_term_goals: '',
    long_term_goals: '',
    patient_expectations: '',
    notes: '',
  });

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const fetchEvaluation = async () => {
    try {
      const { data, error } = await supabase
        .from('physio_medical_records')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (error) throw error;

      // Convertir arrays a strings para los campos de texto
      setFormData({
        chief_complaint: data.chief_complaint || '',
        pain_location: data.pain_location || '',
        pain_duration: data.pain_duration || '',
        pain_type: data.pain_type || '',
        pain_scale_baseline: data.pain_scale_baseline || 0,
        pain_characteristics: data.pain_characteristics || '',
        surgical_history: data.surgical_history || '',
        traumatic_history: data.traumatic_history || '',
        medical_history: data.medical_history || '',
        family_history: data.family_history || '',
        allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : '',
        contraindications: Array.isArray(data.contraindications) ? data.contraindications.join(', ') : '',
        postural_evaluation: data.postural_evaluation || '',
        physical_examination: data.physical_examination || '',
        neurological_screening: data.neurological_screening || '',
        special_tests: data.special_tests || '',
        clinical_diagnosis: data.clinical_diagnosis || '',
        functional_limitations: data.functional_limitations || '',
        short_term_goals: Array.isArray(data.short_term_goals) ? data.short_term_goals.join('\n') : '',
        long_term_goals: Array.isArray(data.long_term_goals) ? data.long_term_goals.join('\n') : '',
        patient_expectations: data.patient_expectations || '',
        notes: data.notes || '',
      });
    } catch (err) {
      console.error('Error fetching evaluation:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Convertir strings a arrays para los campos que lo requieren
      const allergiesArray = formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a) : [];
      const contraindicationsArray = formData.contraindications ? formData.contraindications.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [];
      const shortTermGoalsArray = formData.short_term_goals ? formData.short_term_goals.split('\n').filter((g: string) => g.trim()) : [];
      const longTermGoalsArray = formData.long_term_goals ? formData.long_term_goals.split('\n').filter((g: string) => g.trim()) : [];

      const updateData: Record<string, unknown> = {
        chief_complaint: formData.chief_complaint || null,
        pain_location: formData.pain_location || null,
        pain_duration: formData.pain_duration || null,
        pain_type: formData.pain_type || null,
        pain_scale_baseline: formData.pain_scale_baseline || 0,
        pain_characteristics: formData.pain_characteristics || null,
        surgical_history: formData.surgical_history || null,
        traumatic_history: formData.traumatic_history || null,
        medical_history: formData.medical_history || null,
        family_history: formData.family_history || null,
        allergies: allergiesArray,
        contraindications: contraindicationsArray,
        postural_evaluation: formData.postural_evaluation || null,
        physical_examination: formData.physical_examination || null,
        neurological_screening: formData.neurological_screening || null,
        special_tests: formData.special_tests || null,
        clinical_diagnosis: formData.clinical_diagnosis || null,
        functional_limitations: formData.functional_limitations || null,
        short_term_goals: shortTermGoalsArray,
        long_term_goals: longTermGoalsArray,
        patient_expectations: formData.patient_expectations || null,
        updated_at: new Date().toISOString(),
      };

      // Solo agregar notes si existe el campo
      if ('notes' in (await supabase.from('physio_medical_records').select('*').limit(1).single()).data || false) {
        updateData.notes = formData.notes || null;
      }

      const { error: updateError } = await supabase
        .from('physio_medical_records')
        .update(updateData)
        .eq('id', evaluationId);

      if (updateError) {
        console.error('Supabase error:', updateError);
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/physiotherapy/evaluation/${evaluationId}`);
      }, 2000);

    } catch (err) {
      console.error('Error saving:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando evaluación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error || 'Evaluación no encontrada'}</p>
            <Link href="/dashboard/physiotherapy" className="btn-primary">
              Volver a Fisioterapia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Evaluación Actualizada!</h2>
            <p className="text-gray-500 mb-4">Los cambios se han guardado correctamente.</p>
            <p className="text-sm text-gray-400">Redirigiendo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/physiotherapy/evaluation/${evaluationId}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Evaluación</h1>
          <p className="text-gray-500 mt-1">Modificar datos de la evaluación de fisioterapia</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Datos de la Evaluación
            </h2>
          </div>
          <div className="card-body space-y-6">
            {/* Chief Complaint */}
            <div>
              <label className="label mb-1.5">Motivo de consulta principal *</label>
              <textarea
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Describe el motivo de consulta..."
                required
              />
            </div>

            {/* Pain Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label mb-1.5">Dolor (0-10)</label>
                <input
                  type="number"
                  name="pain_scale_baseline"
                  value={formData.pain_scale_baseline}
                  onChange={handleChange}
                  className="input"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="label mb-1.5">Ubicación</label>
                <input
                  type="text"
                  name="pain_location"
                  value={formData.pain_location}
                  onChange={handleChange}
                  className="input"
                  placeholder="Región corporal"
                />
              </div>
              <div>
                <label className="label mb-1.5">Duración</label>
                <input
                  type="text"
                  name="pain_duration"
                  value={formData.pain_duration}
                  onChange={handleChange}
                  className="input"
                  placeholder="Tiempo con el dolor"
                />
              </div>
              <div>
                <label className="label mb-1.5">Tipo</label>
                <input
                  type="text"
                  name="pain_type"
                  value={formData.pain_type}
                  onChange={handleChange}
                  className="input"
                  placeholder="Agudo, crónico, etc."
                />
              </div>
            </div>

            {/* Characteristics */}
            <div>
              <label className="label mb-1.5">Características del dolor</label>
              <textarea
                name="pain_characteristics"
                value={formData.pain_characteristics}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Describe las características..."
              />
            </div>

            {/* History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Antecedentes quirúrgicos</label>
                <textarea
                  name="surgical_history"
                  value={formData.surgical_history}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Cirugías previas..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Antecedentes traumáticos</label>
                <textarea
                  name="traumatic_history"
                  value={formData.traumatic_history}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Fracturas, lesiones..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Antecedentes médicos</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Enfermedades..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Antecedentes familiares</label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Historia familiar..."
                />
              </div>
            </div>

            {/* Allergies & Contraindications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Alergias (separadas por coma)</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="input"
                  placeholder="Penicilina, latex..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Contraindicaciones (separadas por coma)</label>
                <input
                  type="text"
                  name="contraindications"
                  value={formData.contraindications}
                  onChange={handleChange}
                  className="input"
                  placeholder="Contraindicaciones..."
                />
              </div>
            </div>

            {/* Physical Exam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Evaluación postural</label>
                <textarea
                  name="postural_evaluation"
                  value={formData.postural_evaluation}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Observaciones posturales..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Exploración física</label>
                <textarea
                  name="physical_examination"
                  value={formData.physical_examination}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Hallazgos de exploración..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Screening neurológico</label>
                <textarea
                  name="neurological_screening"
                  value={formData.neurological_screening}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Pruebas neurológicas..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Tests especiales</label>
                <textarea
                  name="special_tests"
                  value={formData.special_tests}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Tests especiales realizados..."
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="label mb-1.5">Diagnóstico clínico</label>
              <textarea
                name="clinical_diagnosis"
                value={formData.clinical_diagnosis}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Diagnóstico principal..."
              />
            </div>

            {/* Limitations */}
            <div>
              <label className="label mb-1.5">Limitaciones funcionales</label>
              <textarea
                name="functional_limitations"
                value={formData.functional_limitations}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Limitaciones funcionales identificadas..."
              />
            </div>

            {/* Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Objetivos a corto plazo (uno por línea)</label>
                <textarea
                  name="short_term_goals"
                  value={formData.short_term_goals}
                  onChange={handleChange}
                  className="input min-h-[120px]"
                  placeholder="Objetivos a corto plazo..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Objetivos a largo plazo (uno por línea)</label>
                <textarea
                  name="long_term_goals"
                  value={formData.long_term_goals}
                  onChange={handleChange}
                  className="input min-h-[120px]"
                  placeholder="Objetivos a largo plazo..."
                />
              </div>
            </div>

            {/* Expectations */}
            <div>
              <label className="label mb-1.5">Expectativas del paciente</label>
              <textarea
                name="patient_expectations"
                value={formData.patient_expectations}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Expectativas y metas del paciente..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label mb-1.5">Notas adicionales</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/physiotherapy/evaluation/${evaluationId}`} className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
