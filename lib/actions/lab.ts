'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type {
  LabOrder,
  LabTestCatalog,
  LabTestParameter,
  LabStats,
  LabOrderStatus,
  LabResultStatus,
} from '@/lib/types';

// ============================================
// CONSULTAS DE CATÁLOGO DE PRUEBAS
// ============================================

export async function getLabTestCatalog(activeOnly: boolean = true): Promise<LabTestCatalog[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('lab_test_catalog')
    .select(`
      *,
      category:lab_categories(id, name, code)
    `)
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener catálogo de pruebas:', error);
    return [];
  }

  return data || [];
}

export async function getLabTestById(id: string): Promise<LabTestCatalog | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('lab_test_catalog')
    .select(`
      *,
      category:lab_categories(id, name, code),
      lab_parameters(*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getLabCategories(): Promise<{ id: string; name: string }[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('lab_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }

  return (data || []) as { id: string; name: string }[];
}

export async function createLabTest(testData: Partial<LabTestCatalog>): Promise<{ success: boolean; error?: string; testId?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('lab_test_catalog')
      .insert(testData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/lab/catalog');
    return { success: true, testId: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear prueba' };
  }
}

export async function updateLabTest(id: string, testData: Partial<LabTestCatalog>): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('lab_test_catalog')
      .update(testData)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/lab/catalog');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar prueba' };
  }
}

export async function deleteLabTest(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('lab_test_catalog')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/lab/catalog');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar prueba' };
  }
}

// ============================================
// PARÁMETROS DE PRUEBAS
// ============================================

export async function createLabParameter(parameterData: Partial<LabTestParameter>): Promise<{ success: boolean; error?: string; paramId?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('lab_parameters')
      .insert(parameterData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, paramId: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear parámetro' };
  }
}

export async function updateLabParameter(id: string, parameterData: Partial<LabTestParameter>): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('lab_parameters')
      .update(parameterData)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar parámetro' };
  }
}

// ============================================
// ÓRDENES DE LABORATORIO
// ============================================

export async function getLabOrders(
  filters?: {
    status?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  },
  limit: number = 50
): Promise<LabOrder[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('lab_orders')
    .select(`
      *,
      patients(id, first_name, last_name, phone, email),
      profiles(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener órdenes:', error);
    return [];
  }

  // Fetch tests and results for each order
  const ordersWithTests = await Promise.all(
    (data || []).map(async (order) => {
      // Get details with tests from lab_order_details
      const { data: details, error: detailsError } = await adminSupabase
        .from('lab_order_details')
        .select(`
          id,
          test_id,
          is_custom,
          custom_name,
          custom_price,
          sample_collected,
          sample_collected_at,
          collected_by,
          notes,
          tests:lab_test_catalog(id, code, name, category:lab_categories(name), price, lab_parameters(id))
        `)
        .eq('order_id', order.id);
      
      if (detailsError) {
        console.error('Error fetching details for order:', order.id, detailsError);
      }
      
      return {
        ...order,
        lab_order_details: details || [],
      };
    })
  );

  console.log('Órdenes con detalles:', ordersWithTests.length);
  if (ordersWithTests.length > 0 && ordersWithTests[0].lab_order_details) {
    console.log('Primera orden detalles:', ordersWithTests[0].lab_order_details.length);
  }

  return ordersWithTests;
}

export async function getLabOrderById(id: string): Promise<LabOrder | null> {
  const adminSupabase = createAdminClient();
  
  // Get the order with all details and results
  const { data: order, error } = await adminSupabase
    .from('lab_orders')
    .select(`
      *,
      patients(*),
      profiles(full_name, role),
      lab_order_details(
        id,
        test_id,
        is_custom,
        custom_name,
        custom_price,
        sample_collected,
        sample_collected_at,
        collected_by,
        notes,
        tests:lab_test_catalog(id, code, name, category:lab_categories(name), price, lab_parameters(*)),
        lab_results(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    console.error('Error al obtener orden:', error);
    return null;
  }

  console.log('Orden obtenida:', order.id);
  console.log('Detalles de la orden:', order.lab_order_details?.length);
  
  return order;
}

export async function createLabOrder(orderData: {
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  test_ids: string[];
  priority?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Generar número de orden único
    let orderNumber: string;
    
    // Intentar usar la función RPC primero
    const { data: rpcOrderNumber } = await adminSupabase
      .rpc('generate_lab_order_number');
    
    if (rpcOrderNumber && typeof rpcOrderNumber === 'string' && rpcOrderNumber.trim() !== '') {
      orderNumber = rpcOrderNumber;
    } else {
      // Fallback: generar número único con timestamp + random
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      orderNumber = `LAB-${dateStr}-${randomSuffix}`;
      
      // Verificar que no exista, si existe generar otro
      const { data: existingOrder } = await adminSupabase
        .from('lab_orders')
        .select('id')
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (existingOrder) {
        // Si ya existe, agregar más randomness
        const newRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
        orderNumber = `LAB-${dateStr}-${newRandom}`;
      }
    }

    // Calcular total
    const { data: tests } = await adminSupabase
      .from('lab_test_catalog')
      .select('price')
      .in('id', orderData.test_ids);

    const totalAmount = tests?.reduce((sum, t) => sum + (Number(t.price) || 0), 0) || 0;

    // Preparar datos de la orden
    const orderInsertData: Record<string, unknown> = {
      order_number: orderNumber,
      patient_id: orderData.patient_id,
      doctor_id: orderData.doctor_id,
      priority: orderData.priority || 'routine',
      notes: orderData.notes,
      total_amount: totalAmount,
      status: 'pending',
    };

    // Agregar appointment_id solo si viene (para compatibilidad con esquemas nuevos)
    if (orderData.appointment_id) {
      orderInsertData.appointment_id = orderData.appointment_id;
    }

    // Crear orden
    const { data: order, error: orderError } = await adminSupabase
      .from('lab_orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      return { success: false, error: orderError.message };
    }

    // Crear registros de pruebas en la orden - Insertar en lab_order_details
    const orderDetails = orderData.test_ids.map(testId => ({
      order_id: order.id,
      test_id: testId,
      sample_collected: false,
    }));

    const { error: testsError } = await adminSupabase
      .from('lab_order_details')
      .insert(orderDetails);

    if (testsError) {
      // Revertir creación de orden
      await adminSupabase.from('lab_orders').delete().eq('id', order.id);
      return { success: false, error: testsError.message };
    }

    revalidatePath('/dashboard/lab');
    revalidatePath('/dashboard/lab/orders');
    
    return { success: true, orderId: order.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear orden' };
  }
}

export async function updateLabOrderStatus(
  orderId: string,
  status: LabOrderStatus,
  reason?: string,
  completedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const updateData: Record<string, unknown> = { status };
    
    // Si hay razón (para cancelaciones), agregarla
    if (reason) {
      updateData.cancel_reason = reason;
    }
    
    // Si se está completando la orden, guardar el usuario que la completó
    if (status === 'completed' && completedBy) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = completedBy;
    }
    
    const { error } = await adminSupabase
      .from('lab_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/lab');
    revalidatePath('/dashboard/lab/orders');
    revalidatePath(`/dashboard/lab/orders/${orderId}`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar estado' };
  }
}

// Verificar que todos los parámetros de todas las pruebas tengan resultados
export async function verifyAllResults(
  orderId: string
): Promise<{ success: boolean; error?: string; missingParams?: number }> {
  try {
    const adminSupabase = createAdminClient();
    
    console.log('[verifyAllResults] === INICIO VERIFICACIÓN ===');
    console.log('[verifyAllResults] Orden ID:', orderId);
    
    // Obtener la orden con todos los detalles Y sus resultados
    const { data: order, error } = await adminSupabase
      .from('lab_orders')
      .select(`
        id,
        lab_order_details(
          id,
          test_id,
          lab_results(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('[verifyAllResults] Error al obtener orden:', error);
      return { success: false, error: 'Orden no encontrada' };
    }

    console.log('[verifyAllResults] Detalles encontrados:', order.lab_order_details?.length);

    // Verificar que existen detalles
    if (!order.lab_order_details || order.lab_order_details.length === 0) {
      console.log('[verifyAllResults] La orden no tiene pruebas asociadas');
      return { success: false, error: 'La orden no tiene pruebas asociadas' };
    }

    // Contar parámetros definidos y resultados guardados
    let totalParams = 0;
    let paramsWithResults = 0;
    let missingDetails: string[] = [];

    // Por cada detalle de orden
    for (const detail of order.lab_order_details) {
      console.log(`\n[verifyAllResults] === DETALLE: ${detail.id} ===`);
      console.log('[verifyAllResults] test_id:', detail.test_id);
      console.log('[verifyAllResults] Resultados ya guardados:', detail.lab_results?.length || 0);
      
      if (detail.lab_results && detail.lab_results.length > 0) {
        console.log('[verifyAllResults] Resultados:');
        detail.lab_results.forEach((r: any) => {
          console.log(`  - id: ${r.id}, parameter_id: ${r.parameter_id}, value_text: ${r.value_text}`);
        });
      }
      
      // Obtener los parámetros de la prueba desde lab_parameters
      const { data: parameters } = await adminSupabase
        .from('lab_parameters')
        .select('id, name')
        .eq('test_id', detail.test_id);

      console.log('[verifyAllResults] Parámetros definidos en la prueba:', parameters?.length);
      if (parameters) {
        parameters.forEach((p) => {
          console.log(`  - ${p.id}: ${p.name}`);
        });
      }

      // Contar resultados generales (parameter_id = null)
      const generalResults = detail.lab_results?.filter((r: any) => r.parameter_id === null) || [];
      console.log('[verifyAllResults] Resultados generales (parameter_id=null):', generalResults.length);

      if (parameters && parameters.length > 0) {
        // La prueba tiene parámetros específicos
        totalParams += parameters.length;
        
        // Verificar cuáles tienen resultados específicos
        for (const param of parameters) {
          // Buscar si hay resultado específico para este parámetro
          const hasSpecificResult = detail.lab_results?.some((r: any) => r.parameter_id === param.id);
          
          console.log(`[verifyAllResults] Parámetro ${param.name}: ¿tiene resultado específico?`, !!hasSpecificResult);
            
          if (hasSpecificResult) {
            paramsWithResults++;
          } else {
            // Si no hay resultado específico, verificar si hay resultados generales disponibles
            // Usar un resultado general si existe
            if (generalResults.length > 0) {
              console.log(`[verifyAllResults] Usando resultado general para parámetro ${param.name}`);
              paramsWithResults++;
              // Marcar este resultado general como usado (simulado)
              generalResults.shift(); 
            } else {
              missingDetails.push(`${detail.id}:${param.id} (${param.name})`);
            }
          }
        }
      } else {
        // La prueba NO tiene parámetros específicos
        // Verificar si tiene algún resultado general (parameter_id = null)
        const hasGeneralResult = detail.lab_results?.some((r: any) => r.parameter_id === null);
        
        console.log('[verifyAllResults] ¿Tiene resultado general (parameter_id=null)?', !!hasGeneralResult);
        
        totalParams++; // 1 parámetro "virtual" para la prueba completa
        if (hasGeneralResult) {
          paramsWithResults++;
        } else {
          missingDetails.push(`${detail.id}:null (resultado general)`);
        }
      }
    }

    console.log(`\n[verifyAllResults] === RESUMEN ===`);
    console.log('[verifyAllResults] Total parámetros requeridos:', totalParams);
    console.log('[verifyAllResults] Parámetros con resultados:', paramsWithResults);
    console.log('[verifyAllResults] Faltantes:', totalParams - paramsWithResults);
    if (missingDetails.length > 0) {
      console.log('[verifyAllResults] Detalles faltantes:', missingDetails);
    }

    // Si no hay parámetros definidos, permitir completar (pruebas simples)
    if (totalParams === 0) {
      console.log('[verifyAllResults] No hay parámetros, se permite completar');
      return { success: true };
    }

    // Si hay parámetros sin resultado, retornar error
    if (paramsWithResults < totalParams) {
      console.log(`[verifyAllResults] Faltan ${totalParams - paramsWithResults} resultados`);
      return { 
        success: false, 
        error: `Faltan ${totalParams - paramsWithResults} resultado(s) por registrar`,
        missingParams: totalParams - paramsWithResults
      };
    }

    console.log('[verifyAllResults] Todos los resultados completos - ÉXITO');
    return { success: true };
  } catch (error) {
    console.error('[verifyAllResults] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error al verificar resultados' };
  }
}

export async function deleteLabOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Primero obtener los detalles de la orden
    const { data: details } = await adminSupabase
      .from('lab_order_details')
      .select('id')
      .eq('order_id', orderId);

    if (details && details.length > 0) {
      // Obtener los IDs de los detalles
      const detailIds = details.map(d => d.id);
      
      // Eliminar los resultados asociados a los detalles
      const { error: resultsError } = await adminSupabase
        .from('lab_results')
        .delete()
        .in('order_detail_id', detailIds);

      if (resultsError) {
        return { success: false, error: resultsError.message };
      }
    }

    // Eliminar los detalles de la orden
    const { error: detailsError } = await adminSupabase
      .from('lab_order_details')
      .delete()
      .eq('order_id', orderId);

    if (detailsError) {
      return { success: false, error: detailsError.message };
    }

    // Finalmente eliminar la orden
    const { error } = await adminSupabase
      .from('lab_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/lab');
    revalidatePath('/dashboard/lab/orders');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar orden' };
  }
}

// ============================================
// MUESTRAS
// ============================================
// Nota: Las funciones de muestras utilizan la tabla 'lab_samples' del schema
// que no se implementa en esta versión inicial del módulo

// ============================================
// RESULTADOS
// ============================================

export async function saveLabResult(resultData: {
  order_detail_id: string;
  parameter_id: string | null;
  value: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    console.log('[saveLabResult] Guardando resultado:', {
      order_detail_id: resultData.order_detail_id,
      parameter_id: resultData.parameter_id,
      value: resultData.value
    });
    
    // NOTA: La tabla lab_results en la base de datos real NO tiene columnas is_abnormal ni is_critical
    // Estas columnas solo existen en el schema de referencia, no en la base de datos en producción
    
    // Verificar si ya existe resultado para este order_detail_id + parameter_id
    let query = adminSupabase
      .from('lab_results')
      .select('id')
      .eq('order_detail_id', resultData.order_detail_id);
    
    // Usar .is() para comparar con NULL ya que .eq() no funciona con NULL
    if (resultData.parameter_id === null) {
      query = query.is('parameter_id', null);
    } else {
      query = query.eq('parameter_id', resultData.parameter_id);
    }
    
    const { data: existingResult, error: selectError } = await query.maybeSingle();
    
    console.log('[saveLabResult] Resultado existente encontrado:', !!existingResult);

    if (selectError) {
      console.error('[saveLabResult] Error al buscar resultado existente:', selectError);
    }

    if (existingResult) {
      console.log('[saveLabResult] Actualizando resultado existente ID:', existingResult.id);
      // Actualizar resultado existente
      const { error } = await adminSupabase
        .from('lab_results')
        .update({
          value_text: resultData.value,
          notes: resultData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResult.id);

      if (error) {
        console.error('[saveLabResult] Error al actualizar:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.log('[saveLabResult] Insertando nuevo resultado');
      // Insertar nuevo resultado
      const { error } = await adminSupabase
        .from('lab_results')
        .insert({
          order_detail_id: resultData.order_detail_id,
          parameter_id: resultData.parameter_id,
          value_text: resultData.value,
          notes: resultData.notes,
        });

      if (error) {
        console.error('[saveLabResult] Error al insertar:', error);
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/dashboard/lab/orders');
    console.log('[saveLabResult] Resultado guardado exitosamente');
    
    return { success: true };
  } catch (error) {
    console.error('[saveLabResult] Error general:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar resultado' };
  }
}

export async function reviewLabResult(
  resultId: string,
  reviewedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('lab_results')
      .update({
        status: 'reviewed',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', resultId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al revisar resultado' };
  }
}

// ============================================
// ESTADÍSTICAS
// ============================================

export async function getLabStats(): Promise<LabStats> {
  const adminSupabase = createAdminClient();
  
  const today = new Date().toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;
  
  // Total de órdenes
  const { count: totalOrders } = await adminSupabase
    .from('lab_orders')
    .select('*', { count: 'exact', head: true });

  // Órdenes pendientes
  const { count: pendingOrders } = await adminSupabase
    .from('lab_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Órdenes en proceso
  const { count: processingOrders } = await adminSupabase
    .from('lab_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress');

  // Órdenes completadas hoy
  const { count: completedToday } = await adminSupabase
    .from('lab_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('updated_at', todayStart);

  // Órdenes urgentes
  const { count: urgentOrders } = await adminSupabase
    .from('lab_orders')
    .select('*', { count: 'exact', head: true })
    .eq('priority', 'urgent')
    .in('status', ['pending', 'in_progress']);

  // Ingresos del día - SOLO órdenes completadas
  const { data: todayOrders } = await adminSupabase
    .from('lab_orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  const totalRevenue = todayOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

  return {
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    processingOrders: processingOrders || 0,
    completedToday: completedToday || 0,
    urgentOrders: urgentOrders || 0,
    totalRevenue,
  };
}

// ============================================
// ÓRDENES RECIENTES PARA DASHBOARD
// ============================================

export async function getRecentLabOrders(limit: number = 10): Promise<LabOrder[]> {
  return getLabOrders(undefined, limit);
}

// ============================================
// ÓRDENES POR PACIENTE
// ============================================

export async function getLabOrdersByPatient(patientId: string): Promise<LabOrder[]> {
  const adminSupabase = createAdminClient();
  
  // Obtener las órdenes del paciente con todos los detalles
  const { data: orders, error } = await adminSupabase
    .from('lab_orders')
    .select(`
      *,
      patients(id, first_name, last_name, phone, dob),
      profiles(full_name, role),
      lab_order_details(
        id,
        test_id,
        is_custom,
        custom_name,
        notes,
        tests:lab_test_catalog(id, code, name, category:lab_categories(name)),
        lab_results(*)
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener órdenes del paciente:', error);
    return [];
  }

  return orders || [];
}
