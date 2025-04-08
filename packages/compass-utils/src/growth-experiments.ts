import { type TrackFunction } from '@mongodb-js/compass-telemetry/provider';

export enum TestName {
  earlyJourneyIndexesGuidance = 'EARLY_JOURNEY_INDEXES_GUIDANCE_20250328',
}

export const fireExperimentViewed = ({
  track,
  testName,
  shouldFire = true,
}: {
  track: TrackFunction;
  testName: TestName;
  shouldFire?: boolean;
}) => {
  if (!shouldFire) {
    return;
  }
  track('Experiment Viewed', {
    test_name: testName,
  });
};
