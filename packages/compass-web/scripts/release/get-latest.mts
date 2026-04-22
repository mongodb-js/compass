import { parseArgs } from 'util';
import {
  ALLOWED_PUBLISH_ENVIRONMENTS,
  DOWNLOADS_BUCKET_PUBLIC_HOST,
} from './utils.mts';

const { positionals } = parseArgs({ allowPositionals: true });

const env = positionals[0] ?? 'dev';

if (!ALLOWED_PUBLISH_ENVIRONMENTS.includes(env)) {
  throw new Error(
    `Trying to resolve latest release for a non-existent environment: "${env}"`
  );
}

const res = await fetch(
  new URL(`/compass/compass-web/${env}/index.mjs`, DOWNLOADS_BUCKET_PUBLIC_HOST)
);
const body = await res.text();
const { groups } = /compass\/tree\/(?<commitHash>.+?)\b/.exec(body) ?? {};

if (!groups?.commitHash) {
  throw new Error(
    `Failed to resolve latest compass-web release for "${env}" environment`
  );
}

process.stdout.write(groups.commitHash);
