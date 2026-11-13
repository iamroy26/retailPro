import { useQuery } from '@tanstack/react-query';
import { getSettings, DEFAULT_SETTINGS } from '@/services/settings';

/** Store settings feed currency, tax and stock thresholds across every screen. */
export function useSettings() {
  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000,
  });

  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}