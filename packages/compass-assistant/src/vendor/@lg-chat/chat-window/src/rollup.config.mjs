import sharedConfig from '@lg-tools/build/config/rollup.config.mjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const config = sharedConfig.map((c) => ({
  ...c,
  plugins: [...c.plugins, nodeResolve()],
}));

export default config;
