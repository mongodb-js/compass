import type { MongoClusterOptions } from 'mongodb-runner';
import { MongoCluster } from 'mongodb-runner';
import { createHash } from 'crypto';
import path from 'path';
import os from 'os';

export type { MongoCluster, MongoClusterOptions } from 'mongodb-runner';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

let isClosed = false;
const clusters = new Map<string, MongoCluster>();
const defaults: MongoClusterOptions = {
  topology: 'standalone',
  tmpDir: path.join(
    os.tmpdir(),
    `compass-tests-${hash(process.env.EVERGREEN_TASK_ID ?? '')}`
  ),
  logDir: process.env.MONGODB_RUNNER_LOGDIR,
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

// mocha-ized variant of startTestServer(), convenient
// for automatic teardown at the right scope and integrated timeout
export function mochaTestServer(
  ...args: Parameters<typeof startTestServer>
): () => MongoCluster {
  let cluster: MongoCluster | undefined;

  before(async function () {
    // Downloading Windows executables in CI takes a long time because
    // they include debug symbols...
    this.timeout(500_000);
    cluster = await startTestServer(...args);
  });

  after(async function () {
    await cluster?.close();
    cluster = undefined;
  });

  return () => {
    if (!cluster) throw new Error('before() hook not ran yet');
    return cluster;
  };
}

if (typeof globalThis.after === 'function') {
  after(async function () {
    isClosed = true;
    const toClose = [...clusters.values()];
    clusters.clear();
    await Promise.all(toClose.map((cluster) => cluster.close()));
  });
}
