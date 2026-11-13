import { useQuery } from '@tanstack/react-query';
import { Plug } from 'lucide-react';
import { checkApiHealth } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const TONES = {
  online: { dot: 'bg-success', label: 'API + database online', text: 'text-success' },
  degraded: { dot: 'bg-warning', label: 'API needs attention', text: 'text-warning' },
  offline: { dot: 'bg-destructive', label: 'API unavailable', text: 'text-destructive' },
};

/**
 * States plainly which backend the app is talking to. It only probes the API
 * while the app is open.
 */
export default function ConnectionBadge({ className, compact = false }) {
  const { data } = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const state = TONES[data?.status ?? 'offline'] ?? TONES.offline;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium',
        className,
      )}
      title={data?.message ?? 'Checking the backend connection'}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', state.dot)} />
      {!compact && <Plug className="h-3 w-3 text-muted-foreground" />}
      <span className={cn('whitespace-nowrap', state.text)}>{state.label}</span>
      {data?.latencyMs ? <span className="text-muted-foreground">{data.latencyMs}ms</span> : null}
    </span>
  );
}
