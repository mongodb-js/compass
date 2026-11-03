import type { DefaultMetrics, Metrics } from 'mongodb-mcp-server';

class NoopDefaultMetrics {
  observe(): void {
    // no-op
  }
}

export class NoopMetrics implements Metrics<DefaultMetrics> {
  constructor() {}
  get<K extends keyof DefaultMetrics>(_key: K): DefaultMetrics[K] {
    return new NoopDefaultMetrics() as unknown as DefaultMetrics[K];
  }
  getMetrics(): Promise<string> {
    return Promise.resolve('');
  }
}
