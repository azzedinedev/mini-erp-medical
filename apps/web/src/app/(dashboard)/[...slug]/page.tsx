import { AppShell } from '@/components/layout/app-shell';
import { ModuleView } from '@/components/modules/module-view';
import { PatientRecordView } from '@/components/modules/patient-record-view';
import { moduleConfigs } from '@/lib/mock-data';

type ModuleKey = keyof typeof moduleConfigs;

export default function ModulePage({ params }: { params: { slug: string[] } }) {
  const requested = params.slug[0] ?? 'patients';
  const module = (requested in moduleConfigs ? requested : 'patients') as ModuleKey;
  return <AppShell>{module === 'patients' && params.slug.length > 1 ? <PatientRecordView code={params.slug[1] ?? 'PAT-000847'} /> : <ModuleView module={module} />}</AppShell>;
}
