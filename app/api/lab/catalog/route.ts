import { NextRequest, NextResponse } from 'next/server';
import { getLabTestCatalog, getLabCategories, createLabTest, updateLabTest, deleteLabTest } from '@/lib/actions/lab';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const categories = searchParams.get('categories') === 'true';

    if (categories) {
      const cats = await getLabCategories();
      return NextResponse.json(cats);
    }

    const catalog = await getLabTestCatalog(activeOnly);
    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Error en GET /api/lab/catalog:', error);
    return NextResponse.json(
      { error: 'Error al obtener catálogo' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      console.log('Creating test with data:', JSON.stringify(data, null, 2));
      const result = await createLabTest(data);
      if (!result.success) {
        console.error('Create test error:', result.error);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, testId: result.testId }, { status: 201 });
    }

    if (action === 'update') {
      const result = await updateLabTest(data.id, data);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const result = await deleteLabTest(data.id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error en POST /api/lab/catalog:', error);
    return NextResponse.json(
      { error: 'Error en la operación' },
      { status: 500 }
    );
  }
}
