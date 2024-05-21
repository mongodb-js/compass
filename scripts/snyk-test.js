'use strict';
const { promises: fs } = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const DEPENDENCY_TEST_RETRIES = 3;
const DEPENDENCY_TEST_TIMEOUT = 10000;

async function snykTest(dependency) {
  const { name, version } = dependency;
  const encodedName = encodeURIComponent(name);
  const apiUrl = `https://api.snyk.io/v1/test/npm/${encodedName}/${version}`;

  let attempts = 0;

  while (attempts < DEPENDENCY_TEST_RETRIES) {
    attempts++;

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(
        () => abortController.abort(),
        DEPENDENCY_TEST_TIMEOUT
      );

      process.stdout.write(`Testing ${name}@${version} ... `);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${process.env.SNYK_TOKEN}`,
        },
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      process.stdout.write(`Done\n`);
      return result.issues.vulnerabilities.map((v) => {
        // for some reason the api doesn't add this property unlike `snyk test`
        return { ...v, name: v.package, fixedIn: v.upgradePath ?? [] };
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(
          `Request timeout for ${name}@${version} (attempt ${attempts})`
        );
      } else {
        console.error(
          `Snyk API request failed for ${name}@${version} (attempt ${attempts}):`,
          err
        );
      }

      if (attempts === DEPENDENCY_TEST_RETRIES) {
        console.error(`Max retries reached for ${name}@${version}`);
        throw new Error(`Testing ${name}@${version} failed.`);
      }
    }
  }
}

async function main() {
  if (!process.env.SNYK_TOKEN) {
    throw new Error('process.env.SNYK_TOKEN is missing.');
  }

  const rootPath = path.resolve(__dirname, '..');
  const dependenciesFiles = [path.join(rootPath, '.sbom', 'dependencies.json')];

  const results = [];

  for (const file of dependenciesFiles) {
    const dependencies = JSON.parse(await fs.readFile(file, 'utf-8'));

    for (const dependency of dependencies) {
      const vulnerabilities = await snykTest(dependency);
      if (vulnerabilities && vulnerabilities.length) {
        results.push({ vulnerabilities });
      }
    }
  }

  await fs.writeFile(
    path.join(rootPath, `.sbom/snyk-test-result.json`),
    JSON.stringify(results, null, 2)
  );
}

main();
