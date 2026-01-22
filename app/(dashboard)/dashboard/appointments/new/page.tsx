import { createAdminClient } from '@/lib/supabase/admin';
import { getAllPatientsForSelect } from '@/lib/actions/patients';
import NewAppointmentForm from './NewAppointmentForm';

export const metadata = {
  title: 'Nueva Cita - MediCore ERP',
  description: 'Agendar una nueva cita médica',
};

export default async function NewAppointmentPage() {
  const adminSupabase = createAdminClient();
  
  // Obtener departamentos
  const { data: departments } = await adminSupabase
    .from('departments')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  // Obtener médicos activos
  const { data: doctors } = await adminSupabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('full_name');

  // Obtener habitaciones disponibles
  const { data: rooms } = await adminSupabase
    .from('rooms')
    .select('id, room_number, room_type')
    .eq('status', 'available')
    .order('room_number');

  // Obtener pacientes usando la función server action
  const patients = await getAllPatientsForSelect();

  return (
    <NewAppointmentForm
      patients={patients}
      departments={departments || []}
      doctors={doctors || []}
      rooms={rooms || []}
    />
  );
}
