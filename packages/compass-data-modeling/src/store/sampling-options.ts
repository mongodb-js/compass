export type SamplingOptions = {
  sampleSize: number;
  allDocuments: boolean;
};

export const DEFAULT_SAMPLING_OPTIONS: SamplingOptions = {
  sampleSize: 100,
  allDocuments: false,
};
