import React from 'react';
import type { TrackFunction } from './track';
import { useTracking } from './provider';

export function useTrackOnChange(
  onChange: (track: TrackFunction) => void,
  dependencies: unknown[],
  options: { skipOnMount: boolean } = { skipOnMount: false }
) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const track = useTracking();
  let initial = true;
  React.useEffect(() => {
    if (options.skipOnMount && initial) {
      initial = false;
      return;
    }
    onChangeRef.current(track);
  }, [...dependencies, track]);
}
