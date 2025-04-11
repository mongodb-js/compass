import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

export enum TestName {
  earlyJourneyIndexesGuidance = 'EARLY_JOURNEY_INDEXES_GUIDANCE_20250328',
}

export const useFireExperimentViewed = ({
  testName,
  shouldFire = true,
}: {
  testName: TestName;
  shouldFire?: boolean;
}) => {
  useTrackOnChange(
    (track: TrackFunction) => {
      if (!shouldFire) {
        return;
      }
      track('Experiment Viewed', {
        test_name: testName,
      });
    },
    [],
    undefined
  );
};
