import { getLabTestCatalog } from '@/lib/actions/lab';
import LabCatalog from '@/components/lab/LabCatalog';

export const dynamic = 'force-dynamic';

async function getCatalog() {
  return getLabTestCatalog(false);
}

export default async function LabCatalogPage() {
  const catalog = await getCatalog();
  return <LabCatalog initialCatalog={catalog} />;
}
