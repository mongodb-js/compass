import type { GoToCandidate } from './go-to-candidates';

export function goToCandidate(
  partial: Pick<GoToCandidate, 'id' | 'kind' | 'primary'> &
    Partial<GoToCandidate>
): GoToCandidate {
  return {
    connectionId: 'c1',
    secondary: '',
    connected: true,
    ...partial,
  };
}
