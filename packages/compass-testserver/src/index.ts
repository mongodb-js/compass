import type { MongoClusterOptions } from 'mongodb-runner';
import { MongoCluster } from 'mongodb-runner';
import path from 'path';
import os from 'os';

export type { MongoCluster, MongoClusterOptions } from 'mongodb-runner';

let isClosed = false;
const clusters = new Map<string, MongoCluster>();
const defaults: MongoClusterOptions = {
  topology: 'standalone',
  tmpDir: path.join(os.tmpdir(), `compass-tests-${Date.now()}`),
  logDir: process.env.COMPASS_TEST_SERVER_LOGDIR,
  version: process.env.MONGODB_VERSION,
};

// Like MongoCluster.start(), but with Compass-specific defaults
export async function startTestServer(
  config: Partial<MongoClusterOptions> & { alwaysStartNewServer?: boolean } = {}
): Promise<MongoCluster> {
  const key = JSON.stringify(config);
  const existing = !config.alwaysStartNewServer && clusters.get(key);
  if (existing && !existing.isClosed()) return existing;
  const cluster = await MongoCluster.start({
    ...defaults,
    ...config,
  });
  if (isClosed) {
    await cluster.close();
    throw new Error('Cluster started while mocha tests were finishing');
  }
  clusters.set(key, cluster);
  return cluster;
}

if (typeof globalThis.after === 'function') {
  after(async function () {
    isClosed = true;
    const toClose = [...clusters.values()];
    clusters.clear();
    await Promise.all(toClose.map((cluster) => cluster.close()));
  });
}
