export type SamplingOptions = {
  sampleSize: number;
  allDocuments: boolean;
};

export const DEFAULT_SAMPLING_OPTIONS: SamplingOptions = {
  sampleSize: 100,
  allDocuments: false,
};

export function areSamplingOptionsValid(options: SamplingOptions): boolean {
  if (options.allDocuments) return true;
  return !isNaN(options.sampleSize) && options.sampleSize > 0;
}
