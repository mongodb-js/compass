import path from 'path';
import { brotliCompressSync } from 'zlib';
import { inspect } from 'util';
import {
  DOWNLOADS_BUCKET,
  DOWNLOADS_BUCKET_PUBLIC_HOST,
  ENTRYPOINT_FILENAME,
  MANIFEST_FILENAME,
  RELEASE_COMMIT,
  asyncPutObject,
  getObjectKey,
} from './utils.mts';

const publicManifestUrl = new URL(
  getObjectKey(MANIFEST_FILENAME),
  DOWNLOADS_BUCKET_PUBLIC_HOST
);

const publicEntrypointUrl = new URL(
  getObjectKey(ENTRYPOINT_FILENAME),
  DOWNLOADS_BUCKET_PUBLIC_HOST
);

let assets: URL[];

function assertResponseIsOk(res: Response) {
  if (res.status !== 200) {
    throw new Error(
      `Request returned a non-OK response: ${res.status} ${res.statusText}`
    );
  }
}

try {
  const res = await fetch(publicManifestUrl);
  assertResponseIsOk(res);
  const manifest = await res.json();

  if (
    !(
      Array.isArray(manifest) &&
      manifest.every((asset) => {
        return typeof asset === 'string';
      })
    )
  ) {
    throw new Error(
      `Manifest schema is not matching: expected string[], got ${inspect(
        manifest
      )}`
    );
  }

  assets = manifest.map((asset) => {
    return new URL(getObjectKey(asset), DOWNLOADS_BUCKET_PUBLIC_HOST);
  });

  await Promise.all(
    assets.map(async (assetUrl) => {
      const res = await fetch(assetUrl, { method: 'HEAD' });
      assertResponseIsOk(res);
    })
  );
} catch (err) {
  throw new AggregateError(
    [err],
    `Aborting publish, failed to resolve manifest ${publicManifestUrl}`
  );
}

const ALLOWED_PUBLISH_ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod'];

const PUBLISH_ENVIRONMENT = process.env.COMPASS_WEB_PUBLISH_ENVIRONMENT;

if (!ALLOWED_PUBLISH_ENVIRONMENTS.includes(PUBLISH_ENVIRONMENT ?? '')) {
  throw new Error(
    `Unknown publish environment: expected ${inspect(
      ALLOWED_PUBLISH_ENVIRONMENTS
    )}, got ${inspect(PUBLISH_ENVIRONMENT)}`
  );
}

function buildProxyEntrypointFile() {
  return (
    assets
      .map((asset) => {
        return `import ${JSON.stringify(asset)};`;
      })
      .concat(
        `export * from ${JSON.stringify(publicEntrypointUrl)};`,
        `/** Compass version: https://github.com/mongodb-js/compass/tree/${RELEASE_COMMIT} */`
      )
      .join('\n') + '\n'
  );
}

const fileKey = getObjectKey('index.mjs', PUBLISH_ENVIRONMENT);
const fileContent = buildProxyEntrypointFile();
const compressedFileContent = brotliCompressSync(fileContent);

console.log(
  'Uploading entrypoint to s3://%s/%s ...',
  DOWNLOADS_BUCKET,
  fileKey
);

const ENTRYPOINT_CACHE_MAX_AGE = 1000 * 60 * 3; // 3mins

const res = await asyncPutObject({
  ACL: 'private',
  Bucket: DOWNLOADS_BUCKET,
  Key: fileKey,
  Body: compressedFileContent,
  ContentType: 'text/javascript',
  ContentEncoding: 'br',
  ContentLength: compressedFileContent.byteLength,
  // "Latest" entrypoint files can change quite often, so max-age is quite
  // short and browser should always revalidate on stale
  CacheControl: `public, max-age=${ENTRYPOINT_CACHE_MAX_AGE}, must-revalidate`,
});

console.log(
  'Successfully uploaded %s (ETag: %s)',
  path.basename(fileKey),
  res.ETag
);
