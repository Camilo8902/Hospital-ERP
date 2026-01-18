import { NextRequest, NextResponse } from 'next/server';
import { getLabOrderById } from '@/lib/actions/lab';
import { formatDateTime, formatDate } from '@/lib/utils';
import PDFDocument from 'pdfkit';
import type { LabTestParameter, LabOrderResult, LabOrderDetail } from '@/lib/types';
import fs from 'fs';
import path from 'path';

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

// Utilidades para parámetros
function getTestParameters(test: { lab_parameters?: LabTestParameter[]; parameters?: LabTestParameter[] } | undefined): LabTestParameter[] {
  if (!test) return [];
  return test.lab_parameters || test.parameters || [];
}

function getReferenceRangeText(param: LabTestParameter): string {
  if ((param as unknown as Record<string, unknown>).reference_text) {
    return (param as unknown as Record<string, unknown>).reference_text as string;
  }
  if (param.ref_range_text) return param.ref_range_text;
  
  let refMin: string | number | null | undefined;
  let refMax: string | number | null | undefined;
  
  if ((param as unknown as Record<string, unknown>).reference_min !== undefined) {
    refMin = (param as unknown as Record<string, unknown>).reference_min;
  } else if (param.ref_range_min !== undefined) {
    refMin = param.ref_range_min;
  }
  
  if ((param as unknown as Record<string, unknown>).reference_max !== undefined) {
    refMax = (param as unknown as Record<string, unknown>).reference_max;
  } else if (param.ref_range_max !== undefined) {
    refMax = param.ref_range_max;
  }
  
  if (refMin !== null && refMin !== undefined && refMax !== null && refMax !== undefined) {
    return `${refMin} - ${refMax}`;
  }
  return '';
}

function isValueAbnormal(param: LabTestParameter, value: string): boolean {
  if (!value) return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  let refMin: number | null | undefined;
  let refMax: number | null | undefined;
  
  if ((param as unknown as Record<string, unknown>).reference_min !== undefined) {
    const val = (param as unknown as Record<string, unknown>).reference_min;
    refMin = val !== null ? Number(val) : null;
  } else if (param.ref_range_min !== undefined) {
    refMin = param.ref_range_min;
  }
  
  if ((param as unknown as Record<string, unknown>).reference_max !== undefined) {
    const val = (param as unknown as Record<string, unknown>).reference_max;
    refMax = val !== null ? Number(val) : null;
  } else if (param.ref_range_max !== undefined) {
    refMax = param.ref_range_max;
  }
  
  if (refMin !== null && refMin !== undefined && numValue < refMin) return true;
  if (refMax !== null && refMax !== undefined && numValue > refMax) return true;
  return false;
}

function getPatientAge(birthDate: string | undefined): string {
  if (!birthDate) return 'No especificada';
  try {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      return 'No especificada';
    }
    
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    if (age < 0 || age > 150) {
      return 'No especificada';
    }
    
    return `${age} años`;
  } catch {
    return 'No especificada';
  }
}

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

// Función para obtener la ruta de los archivos AFM
function getAFMPaths(): { helvetica: string; helveticaBold: string; times: string } {
  // Intentar múltiples ubicaciones para los archivos AFM
  const possiblePaths = [
    // Build output directory (donde el script los copia)
    path.join(process.cwd(), '.next', 'server', 'vendor-chunks', 'data'),
    // Public folder
    path.join(process.cwd(), 'public', 'fonts', 'afm'),
    // node_modules fallback
    path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data'),
  ];
  
  for (const dir of possiblePaths) {
    const helveticaPath = path.join(dir, 'Helvetica.afm');
    const helveticaBoldPath = path.join(dir, 'Helvetica-Bold.afm');
    const timesPath = path.join(dir, 'Times-Roman.afm');
    
    if (fs.existsSync(helveticaPath) && fs.existsSync(helveticaBoldPath)) {
      console.log('Usando fuentes AFM desde:', dir);
      return {
        helvetica: helveticaPath,
        helveticaBold: helveticaBoldPath,
        times: timesPath,
      };
    }
  }
  
  // Fallback a paths por defecto
  return {
    helvetica: path.join(process.cwd(), '.next', 'server', 'vendor-chunks', 'data', 'Helvetica.afm'),
    helveticaBold: path.join(process.cwd(), '.next', 'server', 'vendor-chunks', 'data', 'Helvetica-Bold.afm'),
    times: path.join(process.cwd(), '.next', 'server', 'vendor-chunks', 'data', 'Times-Roman.afm'),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const order = await getLabOrderById(id);

  if (!order) {
    return new NextResponse('Orden no encontrada', { status: 404 });
  }

  const details = (order.lab_order_details || []) as LabOrderDetailWithTest[];

  // Obtener rutas de fuentes AFM
  const fontPaths = getAFMPaths();
  
  // Verificar que las fuentes existan
  const fontsExist = fs.existsSync(fontPaths.helvetica) && fs.existsSync(fontPaths.helveticaBold);
  
  if (!fontsExist) {
    console.error('AFM font files not found:', fontPaths);
    return new NextResponse('Archivos de fuente AFM no encontrados. Ejecuta: npm run setup:pdfkit', { status: 500 });
  }

  // Crear documento PDF
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: `Resultados de Laboratorio - ${order.order_number}`,
      Author: 'Medicore ERP',
      Subject: 'Resultados de Pruebas de Laboratorio',
    },
  });

  // Registrar fuentes AFM personalizadas
  doc.registerFont('Helvetica', fontPaths.helvetica);
  doc.registerFont('Helvetica-Bold', fontPaths.helveticaBold);

  // Establecer fuente por defecto
  doc.font('Helvetica').fontSize(12);

  // Crear respuesta
  const responseStream = new ReadableStream({
    start(controller) {
      doc.on('data', (chunk) => controller.enqueue(chunk));
      doc.on('end', () => controller.close());
      doc.on('error', (err) => controller.error(err));
    },
  });

  const response = new NextResponse(responseStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resultados-laboratorio-${order.order_number}.pdf"`,
    },
  });

  // Funciones helper para fuentes
  const setFont = (size: number, weight: 'normal' | 'bold' = 'normal') => {
    if (weight === 'bold') {
      doc.font('Helvetica-Bold').fontSize(size);
    } else {
      doc.font('Helvetica').fontSize(size);
    }
  };

  const setFontBold = (size: number) => {
    doc.font('Helvetica-Bold').fontSize(size);
  };

  // HEADER
  setFontBold(16);
  doc.fillColor('#1e40af').text('RESULTADOS DE LABORATORIO', { align: 'center' });
  doc.moveDown(0.3);
  setFont(10);
  doc.fillColor('#6b7280').text('Medicore ERP - Sistema de Gestion de Laboratorio', { align: 'center' });
  
  // Linea separadora
  doc.moveDown(0.5);
  doc.strokeColor('#2563eb').lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.8);

  // INFORMACION DE LA ORDEN
  doc.rect(50, doc.y, 512, 25).fill('#eff6ff').stroke('#93c5fd');
  doc.fillColor('#1e40af');
  setFontBold(11);
  doc.text(`Orden: ${order.order_number}`, 60, doc.y - 17);
  doc.fillColor('#64748b');
  setFont(9);
  doc.text(`Fecha: ${formatDateTime(order.created_at)}`, 400, doc.y - 17);
  
  doc.moveDown(1.5);

  // INFORMACION DEL PACIENTE
  doc.fillColor('#334155');
  setFontBold(11);
  doc.text('DATOS DEL PACIENTE', { underline: false });
  doc.moveDown(0.3);
  
  const patientY = doc.y;
  const col1X = 50;
  const col2X = 230;
  const col3X = 410;
  
  // Columna 1
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('NOMBRE', col1X, patientY);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(`${order.patients?.first_name || ''} ${order.patients?.last_name || ''}`, col1X, patientY + 12);
  
  // Columna 2
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('FECHA DE NACIMIENTO', col2X, patientY);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(order.patients?.dob ? formatDate(order.patients.dob) : 'No especificada', col2X, patientY + 12);
  
  // Columna 3
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('EDAD', col3X, patientY);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(getPatientAge(order.patients?.dob), col3X, patientY + 12);
  
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('SEXO', col1X, patientY + 30);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(getGenderLabel(order.patients?.gender), col1X, patientY + 42);
  
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('TELEFONO', col2X, patientY + 30);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(order.patients?.phone || 'No especificado', col2X, patientY + 42);
  
  doc.fillColor('#64748b');
  setFont(8);
  doc.text('DOCTOR SOLICITANTE', col3X, patientY + 30);
  doc.fillColor('#1e293b');
  setFontBold(10);
  doc.text(order.profiles?.full_name || 'No especificado', col3X, patientY + 42);
  
  doc.moveDown(2);

  // RESULTADOS DE PRUEBAS
  for (const detail of details) {
    const test = detail.tests;
    if (!test) continue;
    
    const parameters = getTestParameters(test);
    
    // Encabezado de la prueba
    doc.rect(50, doc.y - 5, 512, 22).fill('#e2e8f0').stroke('#94a3b8');
    doc.fillColor('#1e293b');
    setFontBold(11);
    doc.text(test.name, 60, doc.y - 2);
    doc.fillColor('#64748b');
    setFont(8);
    doc.text(`Codigo: ${test.code || 'N/A'} | Categoria: ${test.category?.name || 'Sin categoria'}`, 60, doc.y + 14);
    
    doc.moveDown(1.5);
    
    if (parameters.length > 0) {
      // Encabezados de la tabla
      const tableTop = doc.y;
      const colX = [55, 235, 335, 435];
      
      doc.rect(50, tableTop - 3, 512, 18).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#475569');
      setFontBold(8);
      doc.text('PARAMETRO', colX[0], tableTop + 2);
      doc.text('RESULTADO', colX[1], tableTop + 2, { width: 100, align: 'center' });
      doc.text('UNIDAD', colX[2], tableTop + 2, { width: 100, align: 'center' });
      doc.text('RANGO REFERENCIA', colX[3], tableTop + 2, { width: 127, align: 'center' });
      
      let rowY = tableTop + 18;
      
      for (const param of parameters) {
        const result = detail.lab_results?.find((r) => r.parameter_id === param.id);
        const value = result?.value_text || '';
        const isAbnormal = isValueAbnormal(param, value);
        
        // Fondo de la fila
        if (isAbnormal) {
          doc.rect(50, rowY - 2, 512, 18).fill('#fef3c7');
        } else {
          doc.rect(50, rowY - 2, 512, 18).fill('#ffffff');
        }
        
        doc.stroke('#cbd5e1').lineWidth(0.5);
        doc.rect(50, rowY - 2, 512, 18).stroke();
        
        // Texto de la fila
        doc.fillColor('#1e293b');
        setFont(9);
        doc.text(param.name || '', colX[0], rowY + 1);
        
        // Resultado
        if (isAbnormal) {
          doc.fillColor('#92400e');
          setFontBold(9);
        } else {
          doc.fillColor('#1e293b');
          setFont(9);
        }
        doc.text(value || '-', colX[1], rowY + 1, { width: 100, align: 'center' });
        
        // Unidad
        doc.fillColor('#64748b');
        setFont(8);
        doc.text(param.unit || '-', colX[2], rowY + 1, { width: 100, align: 'center' });
        
        // Rango de referencia
        const refText = getReferenceRangeText(param);
        doc.text(refText || '-', colX[3], rowY + 1, { width: 127, align: 'center' });
        
        rowY += 18;
      }
      
      doc.y = rowY + 5;
    } else {
      // Sin parametros especificos
      doc.fillColor('#6b7280');
      setFont(9);
      if (detail.lab_results && detail.lab_results.length > 0) {
        doc.text(`Resultado: ${detail.lab_results[0]?.value_text || '-'}`, 60, doc.y);
      } else {
        doc.text('Sin resultados registrados', 60, doc.y);
      }
      doc.moveDown(0.5);
    }
    
    // Notas de la prueba
    if (detail.notes) {
      doc.moveDown(0.5);
      doc.rect(50, doc.y - 3, 512, 16).fill('#fafafa').stroke('#94a3b8').stroke({ dash: [3, 3] });
      doc.fillColor('#6b7280');
      setFontBold(8);
      doc.text('Notas y Observaciones:', 55, doc.y);
      setFont(8);
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#374151');
      doc.text(detail.notes, 170, doc.y, { width: 390 });
      doc.moveDown(0.5);
    }
    
    doc.moveDown(1);
  }
  
  // FOOTER
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Linea de pie
    doc.strokeColor('#cbd5e1').lineWidth(0.5);
    doc.moveTo(50, 720).lineTo(562, 720).stroke();
    
    doc.fillColor('#64748b');
    setFont(8);
    doc.text('Este documento es un comprobante oficial de resultados de laboratorio', 50, 728, { align: 'center' });
    doc.text(`Generado: ${formatDateTime(new Date().toISOString())}`, 50, 740, { align: 'center' });
    doc.text(`Pagina ${i + 1} de ${pageCount}`, 50, 752, { align: 'center' });
  }
  
  // Firmas
  doc.addPage();
  doc.fillColor('#1a1a1a');
  setFont(10);
  
  const signatureY = 200;
  
  doc.moveTo(80, signatureY).lineTo(280, signatureY).stroke();
  doc.text('Responsable del Laboratorio', 80, signatureY + 5, { width: 200, align: 'center' });
  
  doc.moveTo(332, signatureY).lineTo(532, signatureY).stroke();
  doc.text('Medico Tratante', 332, signatureY + 5, { width: 200, align: 'center' });
  
  // Finalizar el documento
  doc.end();
  
  return response;
}
