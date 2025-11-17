import { useCallback, useState } from 'react';

export function useForceUpdate(): () => void {
  const [, setState] = useState({});
  const forceUpdate = useCallback(() => {
    setState({});
  }, []);
  return forceUpdate;
}
