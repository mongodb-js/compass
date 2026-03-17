import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import Debug from 'debug';
import { tmpdir } from 'os';

const debug = Debug('compass-e2e-tests:redirect-extension');

const redirectExtensionDir = fs.mkdtempSync(
  path.join(tmpdir(), 'redirect-extension-')
);

function buildManifest() {
  return {
    manifest_version: 3,
    name: 'Redirect compass-web entrypoint',
    description: 'Redirect fetching compass-web assets to another server',
    version: '1.0',
    permissions: ['declarativeNetRequestWithHostAccess'],
    host_permissions: ['*://*/*'],
    declarative_net_request: {
      rule_resources: [
        {
          id: 'ruleset',
          enabled: true,
          path: 'redirect-rules.json',
        },
      ],
    },
  };
}

function buildRedirectRules(
  fromEntrypointHost: string,
  toEntrypointUrl: string
) {
  return [
    {
      id: 1,
      condition: {
        regexFilter: `^https:\\/\\/${fromEntrypointHost}\\/.+?index\\.mjs`,
        resourceTypes: ['script'],
      },
      action: {
        type: 'redirect',
        redirect: {
          regexSubstitution: toEntrypointUrl,
        },
      },
    },
  ];
}

const compressedExtensionMap: Map<string, Promise<string>> = new Map();

/**
 * Bootstraps a web extension in a temp folder that will redirect compass-web
 * entrypoint from remote resource to some other url as provided to the method.
 */
async function getExtension(
  fromEntrypointHost: string,
  toEntrypointUrl: string
): Promise<{ extensionPath: string; extension: string }> {
  const key = fromEntrypointHost + toEntrypointUrl;
  const maybePromise = compressedExtensionMap.get(key);
  const compressedExtension =
    maybePromise ??
    (async () => {
      debug('Bootstrapping extension at %s', redirectExtensionDir);
      await fs.promises.writeFile(
        path.join(redirectExtensionDir, 'manifest.json'),
        JSON.stringify(buildManifest())
      );
      await fs.promises.writeFile(
        path.join(redirectExtensionDir, 'redirect-rules.json'),
        JSON.stringify(buildRedirectRules(fromEntrypointHost, toEntrypointUrl))
      );
      debug('Compressing extension into a zip');
      const zip = new JSZip();
      for (const file of ['manifest.json', 'redirect-rules.json']) {
        zip.file(
          file,
          fs.createReadStream(path.join(redirectExtensionDir, file))
        );
      }
      return zip.generateAsync({ type: 'base64' });
    })();
  compressedExtensionMap.set(key, compressedExtension);
  return {
    extensionPath: redirectExtensionDir,
    extension: await compressedExtension,
  };
}

export { getExtension };
