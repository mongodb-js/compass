#!/usr/bin/env ts-node
import { clearMlaunch } from '../testing/integration-testing-hooks';
const killAllMongod = process.argv.includes('--killAllMongod');
clearMlaunch({ killAllMongod }).catch(err => process.nextTick(() => { throw err; }));
