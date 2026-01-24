// ============================================================================
// ARCHIVO: lib/types/department-data.ts
// Definiciones de tipos para datos específicos por departamento
// Versión: 1.0.0 | Fecha: 2026-01-23
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS COMPARTIDOS
// ============================================================================

export type WorkflowStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'emergency'
  | 'procedure'
  | 'imaging'
  | 'laboratory'
  | 'surgery'
  | 'physiotherapy';

export type DepartmentCode =
  | 'MG'   // Medicina General
  | 'FT'   // Fisioterapia
  | 'LAB'  // Laboratorio
  | 'RAD'  // Radiología
  | 'CAR'  // Cardiología
  | 'PED'  // Pediatría
  | 'CG'   // Cirugía General
  | 'URG'  // Urgencias
  | 'FAR'  // Farmacia
  | 'OFT'  // Oftalmología
  | 'DER'  // Dermatología
  | 'GIN'  // Ginecología
  | 'PSI'  // Psicología
  | 'NUT'  // Nutrición
  | 'FIS'  // Fisiatría;

// ============================================================================
// INTERFACES BASE
// ============================================================================

export interface BaseDepartmentData {
  notes?: string;
  priority?: 'routine' | 'urgent' | 'emergency';
  assignedDoctorId?: string;
  roomId?: string;
  [key: string]: unknown;
}

// ============================================================================
// FISIOTERAPIA (FT)
// ============================================================================

export type PhysioSessionType = 
  | 'initial_assessment'
  | 'follow_up'
  | 'treatment'
  | 'reassessment'
  | 'electrotherapy'
  | 'hydrotherapy'
  | 'manual_therapy'
  | 'exercise_therapy';

export type BodyRegion = 
  | 'cervical' | 'thoracic' | 'lumbar' | 'sacral'
  | 'shoulder' | 'elbow' | 'wrist' | 'hand'
  | 'hip' | 'knee' | 'ankle' | 'foot'
  | 'whole_body';

export type TherapyTechnique = 
  | 'massage' | 'mobilization' | 'manipulation' | 'stretching' | 'strengthening'
  | 'pneumatic_compression' | 'electrotherapy' | 'ultrasound' | 'laser'
  | 'heat_therapy' | 'cold_therapy' | 'traction' | 'taping'
  | 'myofascial_release' | 'trigger_point';

export type PainType =
  | 'sharp' | 'dull' | 'burning' | 'throbbing' | 'stabbing' | 'aching' | 'tingling' | 'numbness';

export interface PhysiotherapyDepartmentData extends BaseDepartmentData {
  sessionType: PhysioSessionType;
  bodyRegion: BodyRegion[];
  painLevel?: number;
  painType?: PainType;
  techniques?: TherapyTechnique[];
  sessionNumber?: number;
  treatmentPlanId?: string;
  initialAssessmentId?: string;
  estimatedDuration?: number;
  sessionObjectives?: string[];
  equipmentRequired?: string[];
  modality?: string;
  therapistNotes?: string;
  requiresInitialAssessment?: boolean;
  vasScore?: number;
  oswestryScore?: number;
  dashScore?: number;
  romAffected?: Record<string, string>;
  muscleStrengthGrade?: Record<string, number>;
}

export const physiotherapySchema = z.object({
  sessionType: z.enum([
    'initial_assessment', 'follow_up', 'treatment', 'reassessment',
    'electrotherapy', 'hydrotherapy', 'manual_therapy', 'exercise_therapy'
  ]),
  bodyRegion: z.array(z.enum([
    'cervical', 'thoracic', 'lumbar', 'sacral', 'shoulder', 'elbow',
    'wrist', 'hand', 'hip', 'knee', 'ankle', 'foot', 'whole_body'
  ])),
  painLevel: z.number().min(0).max(10).optional(),
  painType: z.enum(['sharp', 'dull', 'burning', 'throbbing', 'stabbing', 'aching', 'tingling', 'numbness']).optional(),
  techniques: z.array(z.enum([
    'massage', 'mobilization', 'manipulation', 'stretching', 'strengthening',
    'pneumatic_compression', 'electrotherapy', 'ultrasound', 'laser',
    'heat_therapy', 'cold_therapy', 'traction', 'taping', 'myofascial_release',
    'trigger_point'
  ])).optional(),
  sessionNumber: z.number().optional(),
  treatmentPlanId: z.string().optional(),
  estimatedDuration: z.number().optional(),
});

// ============================================================================
// LABORATORIO (LAB)
// ============================================================================

export type LabSampleType =
  | 'blood' | 'urine' | 'stool' | 'tissue'
  | 'cerebrospinal_fluid' | 'synovial_fluid' | 'sputum' | 'other';

export type LabPriority = 'routine' | 'urgent' | 'stat';
export type LabOrderStatus = 'pending' | 'sample_collected' | 'in_progress' | 'completed' | 'reviewed' | 'cancelled';

export interface LabTestRequest {
  testId: string;
  testName: string;
  customName?: string;
  customPrice?: number;
  quantity?: number;
}

export interface LaboratoryDepartmentData extends BaseDepartmentData {
  sampleType: LabSampleType;
  tests: LabTestRequest[];
  priority: LabPriority;
  requiresFasting?: boolean;
  fastingHours?: number;
  preparationInstructions?: string;
  orderId?: string;
  orderNumber?: string;
  orderStatus?: LabOrderStatus;
  volumeRequired?: number;
  containerType?: 'tube_vacutainer' | 'sterile_container' | 'slide' | 'bag';
  transportConditions?: 'room_temperature' | 'refrigerated' | 'frozen' | 'protected_light';
  multipleSamples?: boolean;
  sampleCount?: number;
  patientLabels?: Array<{ labelId: string; sampleType: LabSampleType; printedAt: string }>;
}

export const laboratorySchema = z.object({
  sampleType: z.enum([
    'blood', 'urine', 'stool', 'tissue', 'cerebrospinal_fluid',
    'synovial_fluid', 'sputum', 'other'
  ]),
  tests: z.array(z.object({
    testId: z.string(),
    testName: z.string(),
    customName: z.string().optional(),
    customPrice: z.number().optional(),
    quantity: z.number().optional(),
  })),
  priority: z.enum(['routine', 'urgent', 'stat']),
  requiresFasting: z.boolean().optional(),
  fastingHours: z.number().optional(),
  preparationInstructions: z.string().optional(),
  multipleSamples: z.boolean().optional(),
  sampleCount: z.number().optional(),
});

// ============================================================================
// RADIOLOGÍA / IMAGENOLOGÍA (RAD)
// ============================================================================

export type ImagingType =
  | 'xray' | 'ultrasound' | 'ct' | 'mri' | 'mammography'
  | 'fluoroscopy' | 'angiography' | 'bone_densitometry' | 'pet_scan';

export type BodyPart =
  | 'head' | 'neck' | 'chest' | 'abdomen' | 'pelvis'
  | 'spine' | 'upper_extremity' | 'lower_extremity' | 'whole_body';

export interface ImagingDepartmentData extends BaseDepartmentData {
  imagingType: ImagingType;
  bodyPart: BodyPart;
  specificRegion?: string;
  contrastRequired?: boolean;
  contrastType?: 'iodine' | 'gadolinium' | 'barium' | 'none';
  contrastDose?: number;
  pregnancyRisk?: boolean;
  lastMenstrualPeriod?: string;
  preProcedureInstructions?: string;
  contrastAllergy?: boolean;
  previousReaction?: string;
  injectorName?: string;
  kvUsed?: number;
  masUsed?: number;
  radiationDose?: number;
  shotCount?: number;
  reportUrl?: string;
  imagesUrl?: string[];
  priorStudyAccess?: boolean;
  priorStudyId?: string;
}

export const imagingSchema = z.object({
  imagingType: z.enum([
    'xray', 'ultrasound', 'ct', 'mri', 'mammography',
    'fluoroscopy', 'angiography', 'bone_densitometry', 'pet_scan'
  ]),
  bodyPart: z.enum([
    'head', 'neck', 'chest', 'abdomen', 'pelvis',
    'spine', 'upper_extremity', 'lower_extremity', 'whole_body'
  ]),
  specificRegion: z.string().optional(),
  contrastRequired: z.boolean().optional(),
  contrastType: z.enum(['iodine', 'gadolinium', 'barium', 'none']).optional(),
  pregnancyRisk: z.boolean().optional(),
  preProcedureInstructions: z.string().optional(),
});

// ============================================================================
// MEDICINA GENERAL (MG)
// ============================================================================

export type VisitType = 'new_patient' | 'follow_up' | 'preventive' | 'acute_illness' | 'chronic_disease';

export interface GeneralMedicineData extends BaseDepartmentData {
  visitType: VisitType;
  chiefComplaint?: string;
  symptoms?: string[];
  symptomDuration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  includesPhysicalExam?: boolean;
  includesVitalSigns?: boolean;
  procedureType?: string;
  requiresReferral?: boolean;
  referralType?: 'specialist' | 'laboratory' | 'imaging' | 'physiotherapy' | 'emergency';
  referralDepartmentId?: string;
  suggestedIcdCodes?: string[];
}

export const generalMedicineSchema = z.object({
  visitType: z.enum(['new_patient', 'follow_up', 'preventive', 'acute_illness', 'chronic_disease']),
  chiefComplaint: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  requiresReferral: z.boolean().optional(),
  referralType: z.enum(['specialist', 'laboratory', 'imaging', 'physiotherapy', 'emergency']).optional(),
});

// ============================================================================
// CIRUGÍA (CG)
// ============================================================================

export type SurgeryType = 'minor' | 'major' | 'ambulatory' | 'emergency';
export type SurgeryStatus = 'scheduled' | 'pre_op' | 'in_progress' | 'recovery' | 'completed' | 'cancelled';

export interface SurgeryDepartmentData extends BaseDepartmentData {
  surgeryType: SurgeryType;
  procedureName?: string;
  cptCode?: string;
  surgeryStatus?: SurgeryStatus;
  operatingRoom?: string;
  surgicalTeam?: string[];
  anesthesiaType?: 'local' | 'regional' | 'general' | 'sedation';
  estimatedDuration?: number;
  preOpPreparation?: string;
  consentSigned?: boolean;
  consentDate?: string;
  prophylacticAntibiotic?: string;
  estimatedBloodLoss?: number;
  postOpNotes?: string;
}

export const surgerySchema = z.object({
  surgeryType: z.enum(['minor', 'major', 'ambulatory', 'emergency']),
  procedureName: z.string().optional(),
  cptCode: z.string().optional(),
  surgeryStatus: z.enum(['scheduled', 'pre_op', 'in_progress', 'recovery', 'completed', 'cancelled']).optional(),
  anesthesiaType: z.enum(['local', 'regional', 'general', 'sedation']).optional(),
  estimatedDuration: z.number().optional(),
  consentSigned: z.boolean().optional(),
});

// ============================================================================
// CARDIOLOGÍA (CAR)
// ============================================================================

export type CardiologyTestType =
  | 'ecg' | 'echocardiogram' | 'stress_test' | 'holter'
  | 'event_monitor' | 'cardiac_catheterization' | 'heart_ultrasound';

export interface CardiologyDepartmentData extends BaseDepartmentData {
  testType: CardiologyTestType;
  indication?: string;
  cardiacHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  previousFindings?: string;
  requiresFasting?: boolean;
  monitoringDuration?: number;
  electrodePlacement?: string;
}

export const cardiologySchema = z.object({
  testType: z.enum([
    'ecg', 'echocardiogram', 'stress_test', 'holter',
    'event_monitor', 'cardiac_catheterization', 'heart_ultrasound'
  ]),
  indication: z.string().optional(),
  cardiacHistory: z.array(z.string()).optional(),
  requiresFasting: z.boolean().optional(),
});

// ============================================================================
// PEDIATRÍA (PED)
// ============================================================================

export type PediatricVisitType = 'well_child_check' | 'vaccination' | 'sick_visit' | 'developmental_screening' | 'nutrition_counseling';

export interface PediatricsDepartmentData extends BaseDepartmentData {
  visitType: PediatricVisitType;
  weight?: number;
  height?: number;
  headCircumference?: number;
  temperature?: number;
  vaccinesAdministered?: string[];
  vaccinesPending?: string[];
  growthChart?: { weightPercentile?: number; heightPercentile?: number; bmiPercentile?: number };
  motorDevelopment?: string;
  languageDevelopment?: string;
  guardianName?: string;
  guardianDni?: string;
  guardianRelation?: 'father' | 'mother' | 'guardian' | 'other';
}

export const pediatricsSchema = z.object({
  visitType: z.enum(['well_child_check', 'vaccination', 'sick_visit', 'developmental_screening', 'nutrition_counseling']),
  weight: z.number().optional(),
  height: z.number().optional(),
  headCircumference: z.number().optional(),
  vaccinesAdministered: z.array(z.string()).optional(),
});

// ============================================================================
// URGENCIAS (URG)
// ============================================================================

export type TriageLevel = 'resuscitation' | 'emergency' | 'urgent' | 'less_urgent' | 'non_urgent';
export type ChiefComplaintCategory = 'pain' | 'injury' | 'respiratory' | 'cardiac' | 'neurological' | 'gastrointestinal' | 'psychiatric' | 'other';

export interface EmergencyDepartmentData extends BaseDepartmentData {
  triageLevel: TriageLevel;
  chiefComplaintCategory?: ChiefComplaintCategory;
  specificComplaint?: string;
  waitTime?: number;
  vitalSignsArrival?: {
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
    painScore?: number;
  };
  requiresResuscitation?: boolean;
  arrivedByEMS?: boolean;
  emsArrivalTime?: string;
  emergencyCode?: 'trauma' | 'cardiac' | 'stroke' | 'sepsis' | 'none';
  referredFrom?: 'self' | 'clinic' | 'ems' | 'other_hospital';
}

export const emergencySchema = z.object({
  triageLevel: z.enum(['resuscitation', 'emergency', 'urgent', 'less_urgent', 'non_urgent']),
  chiefComplaintCategory: z.enum(['pain', 'injury', 'respiratory', 'cardiac', 'neurological', 'gastrointestinal', 'psychiatric', 'other']).optional(),
  requiresResuscitation: z.boolean().optional(),
  arrivedByEMS: z.boolean().optional(),
  emergencyCode: z.enum(['trauma', 'cardiac', 'stroke', 'sepsis', 'none']).optional(),
});

// ============================================================================
// OFTALMOLOGÍA (OFT)
// ============================================================================

export type OphthalmologyTestType = 'visual_acuity' | 'refraction' | 'tonometry' | 'fundoscopy' | 'visual_field' | 'oct';

export interface OphthalmologyDepartmentData extends BaseDepartmentData {
  testType: OphthalmologyTestType;
  visualAcuityOD?: string;
  visualAcuityOS?: string;
  refractionOD?: { sphere?: string; cylinder?: string; axis?: number };
  refractionOS?: { sphere?: string; cylinder?: string; axis?: number };
  iopOD?: number;
  iopOS?: number;
  preliminaryDiagnosis?: string;
  requiresDilation?: boolean;
  dropsUsed?: string[];
}

export const ophthalmologySchema = z.object({
  testType: z.enum(['visual_acuity', 'refraction', 'tonometry', 'fundoscopy', 'visual_field', 'oct']),
  visualAcuityOD: z.string().optional(),
  visualAcuityOS: z.string().optional(),
  iopOD: z.number().optional(),
  iopOS: z.number().optional(),
});

// ============================================================================
// PSICOLOGÍA (PSI)
// ============================================================================

export type PsychologySessionType = 'initial_evaluation' | 'individual_therapy' | 'couple_therapy' | 'family_therapy' | 'group_therapy' | 'cognitive_assessment';
export type TherapyApproach = 'cognitive_behavioral' | 'psychodynamic' | 'humanistic' | 'systemic' | 'integrative';

export interface PsychologyDepartmentData extends BaseDepartmentData {
  sessionType: PsychologySessionType;
  therapyApproach?: TherapyApproach;
  interventionArea?: string[];
  phq9Score?: number;
  gad7Score?: number;
  suicidalRisk?: 'none' | 'low' | 'moderate' | 'high';
  safetyPlan?: string;
  recommendedFrequency?: string;
  sessionGoals?: string[];
  topicsDiscussed?: string[];
  sleepHabits?: string;
  moodDescription?: string;
}

export const psychologySchema = z.object({
  sessionType: z.enum(['initial_evaluation', 'individual_therapy', 'couple_therapy', 'family_therapy', 'group_therapy', 'cognitive_assessment']),
  therapyApproach: z.enum(['cognitive_behavioral', 'psychodynamic', 'humanistic', 'systemic', 'integrative']).optional(),
  suicidalRisk: z.enum(['none', 'low', 'moderate', 'high']).optional(),
});

// ============================================================================
// NUTRICIÓN (NUT)
// ============================================================================

export type NutritionConsultationType = 'initial_assessment' | 'follow_up' | 'meal_planning' | 'weight_management' | 'sports_nutrition' | 'clinical_nutrition';

export interface NutritionDepartmentData extends BaseDepartmentData {
  consultationType: NutritionConsultationType;
  currentWeight?: number;
  height?: number;
  bmi?: number;
  targetWeight?: number;
  bodyFatPercentage?: number;
  waistCircumference?: number;
  dietaryHistory?: string;
  dietaryRestrictions?: string[];
  foodAllergies?: string[];
  foodPreferences?: string[];
  physicalActivityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  mainGoal?: string;
  mealPlanId?: string;
  supplementsPrescribed?: string[];
  targetDailyCalories?: number;
}

export const nutritionSchema = z.object({
  consultationType: z.enum(['initial_assessment', 'follow_up', 'meal_planning', 'weight_management', 'sports_nutrition', 'clinical_nutrition']),
  currentWeight: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  foodAllergies: z.array(z.string()).optional(),
});

// ============================================================================
// TIPO UNIÓN PARA TODOS LOS DEPARTAMENTOS
// ============================================================================

export type DepartmentData =
  | PhysiotherapyDepartmentData
  | LaboratoryDepartmentData
  | ImagingDepartmentData
  | GeneralMedicineData
  | SurgeryDepartmentData
  | CardiologyDepartmentData
  | PediatricsDepartmentData
  | EmergencyDepartmentData
  | OphthalmologyDepartmentData
  | PsychologyDepartmentData
  | NutritionDepartmentData
  | BaseDepartmentData;

// ============================================================================
// MAPA DE CÓDIGOS A TIPOS
// ============================================================================

export const DEPARTMENT_DATA_TYPES: Record<DepartmentCode, string> = {
  'FT': 'PhysiotherapyDepartmentData',
  'LAB': 'LaboratoryDepartmentData',
  'RAD': 'ImagingDepartmentData',
  'MG': 'GeneralMedicineData',
  'CG': 'SurgeryDepartmentData',
  'CAR': 'CardiologyDepartmentData',
  'PED': 'PediatricsDepartmentData',
  'URG': 'EmergencyDepartmentData',
  'OFT': 'OphthalmologyDepartmentData',
  'PSI': 'PsychologyDepartmentData',
  'NUT': 'NutritionDepartmentData',
  'FAR': 'BaseDepartmentData',
  'DER': 'BaseDepartmentData',
  'GIN': 'BaseDepartmentData',
  'FIS': 'BaseDepartmentData',
};

export const DEPARTMENT_SCHEMAS: Record<DepartmentCode, z.ZodType<unknown>> = {
  'FT': physiotherapySchema,
  'LAB': laboratorySchema,
  'RAD': imagingSchema,
  'MG': generalMedicineSchema,
  'CG': surgerySchema,
  'CAR': cardiologySchema,
  'PED': pediatricsSchema,
  'URG': emergencySchema,
  'OFT': ophthalmologySchema,
  'PSI': psychologySchema,
  'NUT': nutritionSchema,
  'FAR': z.record(z.string(), z.unknown()),
  'DER': z.record(z.string(), z.unknown()),
  'GIN': z.record(z.string(), z.unknown()),
  'FIS': z.record(z.string(), z.unknown()),
};

// ============================================================================
// UTILIDADES DE TIPO
// ============================================================================

export type InferDepartmentData<T extends DepartmentCode> = 
  T extends 'FT' ? PhysiotherapyDepartmentData :
  T extends 'LAB' ? LaboratoryDepartmentData :
  T extends 'RAD' ? ImagingDepartmentData :
  T extends 'MG' ? GeneralMedicineData :
  T extends 'CG' ? SurgeryDepartmentData :
  T extends 'CAR' ? CardiologyDepartmentData :
  T extends 'PED' ? PediatricsDepartmentData :
  T extends 'URG' ? EmergencyDepartmentData :
  T extends 'OFT' ? OphthalmologyDepartmentData :
  T extends 'PSI' ? PsychologyDepartmentData :
  T extends 'NUT' ? NutritionDepartmentData :
  BaseDepartmentData;

export function getDepartmentDataType(code: DepartmentCode): string {
  return DEPARTMENT_DATA_TYPES[code] || 'BaseDepartmentData';
}

export function validateDepartmentData(
  code: DepartmentCode,
  data: Record<string, unknown>
): { success: boolean; data?: DepartmentData; error?: string } {
  const schema = DEPARTMENT_SCHEMAS[code];
  
  if (!schema) {
    return { success: true, data: data as DepartmentData };
  }

  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data as DepartmentData };
  }
  
  return { 
    success: false, 
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
  };
}

export function createDefaultDepartmentData<T extends DepartmentCode>(code: T): InferDepartmentData<T> {
  const defaults: Record<DepartmentCode, DepartmentData> = {
    FT: { sessionType: 'treatment', bodyRegion: [], notes: '', priority: 'routine' },
    LAB: { sampleType: 'blood', tests: [], priority: 'routine' },
    RAD: { imagingType: 'xray', bodyPart: 'chest' },
    MG: { visitType: 'follow_up' },
    CG: { surgeryType: 'minor' },
    CAR: { testType: 'ecg' },
    PED: { visitType: 'well_child_check' },
    URG: { triageLevel: 'urgent' },
    OFT: { testType: 'visual_acuity' },
    PSI: { sessionType: 'individual_therapy' },
    NUT: { consultationType: 'follow_up' },
    FAR: {},
    DER: {},
    GIN: {},
    FIS: {},
  };
  
  return defaults[code] as InferDepartmentData<T>;
}

export default {
  PhysiotherapyDepartmentData,
  LaboratoryDepartmentData,
  ImagingDepartmentData,
  GeneralMedicineData,
  SurgeryDepartmentData,
  CardiologyDepartmentData,
  PediatricsDepartmentData,
  EmergencyDepartmentData,
  OphthalmologyDepartmentData,
  PsychologyDepartmentData,
  NutritionDepartmentData,
  DepartmentData,
  DEPARTMENT_SCHEMAS,
  validateDepartmentData,
  createDefaultDepartmentData,
};
