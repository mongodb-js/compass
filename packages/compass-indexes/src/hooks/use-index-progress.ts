import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { InProgressIndex } from '../modules/regular-indexes';
import { getIndexesProgress } from '../modules/regular-indexes';
import type { IndexesThunkDispatch } from '../modules';

/** 1 seconds polling interval */
const INDEX_INIT_PROGRESS_POLLING_INTERVAL_MS = 1 * 1000;
/** 10 seconds polling interval */
const INDEX_PROGRESS_POLLING_INTERVAL_MS = 10 * 1000;

/**
 * Custom hook to manage index build progress tracking
 * This hook automatically starts/stops progress polling for indexes that are:
 * 1. Being created (status: 'inprogress') - monitors for when build starts
 * 2. Currently building (progressPercentage > 0% and < 100%) - tracks build progress
 */
export function useIndexProgress(inProgressIndexes: InProgressIndex[]) {
  const dispatch = useDispatch<IndexesThunkDispatch>();
  const timeoutRef = useRef<number | undefined>(undefined);
  const checksRef = useRef<number>(0);

  useEffect(() => {
    const indexesToTrack = inProgressIndexes.filter((index) => {
      const notFailed = index.status !== 'failed';
      const inProgress = index.status === 'inprogress';
      const progressPercentage = index.progressPercentage ?? 0;
      const stillPartiallyBuilt =
        progressPercentage > 0 && progressPercentage < 100;

      const shouldTrack = notFailed && (inProgress || stillPartiallyBuilt);

      return shouldTrack;
    });

    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;

    if (indexesToTrack.length) {
      checksRef.current = 0;

      const updateIndexProgress = () => {
        checksRef.current += 1;
        void dispatch(getIndexesProgress(indexesToTrack)).finally(() => {
          if (timeoutRef.current) {
            // After the first 3 checks, slow down the poller
            setTimeout(
              updateIndexProgress,
              checksRef.current < 3
                ? INDEX_INIT_PROGRESS_POLLING_INTERVAL_MS
                : INDEX_PROGRESS_POLLING_INTERVAL_MS
            );
          }
        });
      };

      if (!timeoutRef.current) updateIndexProgress();
    }

    return () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    };
  }, [inProgressIndexes, dispatch]);
}
