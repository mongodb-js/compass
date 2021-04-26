#!/usr/bin/env ts-node
import { getMlaunchPath, ensureMongodAvailable } from '../testing/integration-testing-hooks';
(async () => {
  const mlaunchpath = await getMlaunchPath();
  const binarypath = await ensureMongodAvailable();
  console.log({ mlaunchpath, binarypath });
})().catch(err => process.nextTick(() => { throw err; }));
