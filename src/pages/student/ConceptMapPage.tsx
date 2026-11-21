import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ConceptGraphView } from '../../components/ConceptGraphView';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { LearnerConceptMastery } from '../../../shared/types';

export function ConceptMapPage() {
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState<LearnerConceptMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ concepts: LearnerConceptMastery[] }>('/api/student/concepts');
        if (active) setConcepts(res.concepts);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load concept graph.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Concept Knowledge Graph">
      {loading ? (
        <div className="h-[480px] rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      ) : error ? (
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </SurfaceCard>
      ) : (
        <ConceptGraphView
          concepts={concepts}
          onPracticeConcept={(conceptId) => navigate(`/student/practice?conceptId=${conceptId}`)}
        />
      )}
    </AppShell>
  );
}
