import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { InProgressIndex } from '../modules/regular-indexes';
import { getIndexesProgress } from '../modules/regular-indexes';
import type { IndexesThunkDispatch } from '../modules';

/** 10 seconds polling interval */
const INDEX_PROGRESS_POLLING_INTERVAL_MS = 10_000;

/**
 * Custom hook to manage index build progress tracking
 * This hook automatically starts/stops progress polling for indexes that are:
 * 1. Being created (status: 'inprogress') - monitors for when build starts
 * 2. Currently building (progressPercentage > 0% and < 100%) - tracks build progress
 */
export function useIndexProgress(inProgressIndexes: InProgressIndex[]) {
  const dispatch = useDispatch<IndexesThunkDispatch>();
  const timeoutRef = useRef<number | undefined>(undefined);

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
      const updateIndexProgress = () => {
        void dispatch(getIndexesProgress(indexesToTrack)).finally(() => {
          if (timeoutRef.current) {
            // After the first 3 checks, slow down the poller
            timeoutRef.current = +setTimeout(
              updateIndexProgress,
              INDEX_PROGRESS_POLLING_INTERVAL_MS
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
