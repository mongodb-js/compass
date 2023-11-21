// Allows to get the monorepo root consistently and spot issues in case we are moving
// files around.

import path from 'path';
const root = path.resolve(__dirname, '..', '..', '..', '..');
export const getMonorepoRoot = () => root;
