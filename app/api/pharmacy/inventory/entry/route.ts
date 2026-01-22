import { NextRequest, NextResponse } from 'next/server';
import { addStockEntry } from '@/lib/actions/pharmacy';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const productId = formData.get('product_id') as string;
    const quantityStr = formData.get('quantity') as string;
    const notes = formData.get('notes') as string;
    const file = formData.get('file') as File | null;

    if (!productId || !quantityStr) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (product_id, quantity)' },
        { status: 400 }
      );
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser un número válido mayor a 0' },
        { status: 400 }
      );
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    // Subir archivo si existe
    if (file && file.size > 0) {
      const supabase = createAdminClient();
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop() || '';
      const uniqueFileName = `entry_${productId}_${timestamp}_${randomStr}.${fileExtension}`;
      
      // Convertir File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Subir al bucket de inventario
      const { error: uploadError } = await supabase.storage
        .from('inventory_documents')
        .upload(uniqueFileName, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        return NextResponse.json(
          { error: 'Error al subir archivo: ' + uploadError.message },
          { status: 500 }
        );
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('inventory_documents')
        .getPublicUrl(uniqueFileName);

      fileUrl = urlData.publicUrl;
      fileName = file.name;
    }

    // Registrar la entrada de inventario
    const result = await addStockEntry({
      productId,
      quantity,
      notes: notes || undefined,
      fileUrl,
      fileName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al registrar entrada' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      movementId: result.movementId,
      message: 'Entrada de inventario registrada exitosamente'
    });
  } catch (error) {
    console.error('Error al procesar entrada de inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
