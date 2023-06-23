const initialGCValue = process.env.DISABLE_GUIDE_CUES;

export function mochaGlobalSetup() {
  process.env.DISABLE_GUIDE_CUES = 'true';
}

export function mochaGlobalTeardown() {
  process.env.DISABLE_GUIDE_CUES = initialGCValue;
}
