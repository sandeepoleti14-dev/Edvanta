import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ConceptGraphView } from '../../components/ConceptGraphView';
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
        <div className="h-[480px] rounded-xl bg-white border border-slate-200 animate-pulse" />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 flex items-center gap-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : (
        <ConceptGraphView
          concepts={concepts}
          onPracticeConcept={(conceptId) => navigate(`/student/practice?conceptId=${conceptId}`)}
        />
      )}
    </AppShell>
  );
}
