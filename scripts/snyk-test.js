'use strict';
const { promises: fs } = require('fs');
const path = require('path');
const fetch = require('make-fetch-happen');

const MAKE_FETCH_HAPPEN_OPTIONS = {
  timeout: 10000,
  retry: {
    retries: 3,
    factor: 1,
    minTimeout: 1000,
    maxTimeout: 3000,
    randomize: true,
  },
};

async function snykTest(dependency) {
  const { name, version } = dependency;

  process.stdout.write(`Testing ${name}@${version} ... `);

  const response = await fetch(
    `https://api.snyk.io/v1/test/npm/${encodeURIComponent(name)}/${version}`,
    {
      ...MAKE_FETCH_HAPPEN_OPTIONS,
      headers: {
        Authorization: `token ${process.env.SNYK_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const vulnerabilities = (await response.json()).issues?.vulnerabilities ?? [];

  process.stdout.write(`Done\n`);

  return vulnerabilities.map((v) => {
    // for some reason the api doesn't add these properties unlike `snyk test`
    return { ...v, name: v.package, fixedIn: v.upgradePath ?? [] };
  });
}

async function main() {
  if (!process.env.SNYK_TOKEN) {
    throw new Error('process.env.SNYK_TOKEN is missing.');
  }

  const rootPath = path.resolve(__dirname, '..');

  const dependenciesFile = path.join(rootPath, '.sbom', 'dependencies.json');
  const dependencies = JSON.parse(await fs.readFile(dependenciesFile, 'utf-8'));

  const results = [];

  for (const dependency of dependencies) {
    const vulnerabilities = await snykTest(dependency);
    if (vulnerabilities && vulnerabilities.length) {
      results.push({ vulnerabilities });
    }
  }

  await fs.writeFile(
    path.join(rootPath, `.sbom/snyk-test-result.json`),
    JSON.stringify(results, null, 2)
  );
}

main();
