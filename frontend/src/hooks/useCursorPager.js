import { useCallback, useState } from 'react';

/**
 * Keeps the cursor trail for a paged list so "Previous" is possible with a
 * cursor-based data source.
 */
export function useCursorPager() {
  const [cursors, setCursors] = useState([null]);
  const [index, setIndex] = useState(0);

  const reset = useCallback(() => {
    setCursors([null]);
    setIndex(0);
  }, []);

  const goNext = useCallback(
    (nextCursor) => {
      if (!nextCursor) return;
      setCursors((previous) => [...previous.slice(0, index + 1), nextCursor]);
      setIndex((current) => current + 1);
    },
    [index],
  );

  const goPrev = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

  return {
    cursor: cursors[index] ?? null,
    page: index + 1,
    canGoPrev: index > 0,
    goNext,
    goPrev,
    reset,
  };
}