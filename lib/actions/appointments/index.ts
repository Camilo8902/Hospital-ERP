// =============================================================================
// ARCHIVO: lib/actions/appointments/index.ts
// Descripción: Índice centralizado de exports para server actions de citas
//              Organizado por módulo y tipo de operación
// =============================================================================

// Base operations - Comunes a todos los departamentos
export { getAppointments, searchAppointmentsByPhysioData } from './base/getAppointments';
export { getAppointmentById, getAppointmentPhysioContext } from './base/getAppointmentById';

// Fisiotherapy operations - Específicas del departamento de fisioterapia
export { 
  createPhysioAppointment, 
  createPhysioSession 
} from './physiotherapy/createPhysioAppointment';

export { 
  linkToMedicalRecord, 
  getPatientPhysioContext, 
  createPhysioMedicalRecord 
} from './physiotherapy/linkToMedicalRecord';

export { 
  completePhysioSession, 
  updatePhysioWorkflowStatus 
} from './physiotherapy/completePhysioSession';

// Medicine general operations - Próximamente
// export { createGeneralAppointment } from './general-medicine/createGeneralAppointment';
