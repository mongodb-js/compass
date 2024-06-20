const tracking: { event: string; properties: any }[] = ((
  globalThis as any
).tracking = []);

export const sandboxTelemetry = {
  track: (event: string, properties: any) => {
    tracking.push({ event, properties });
  },
};
