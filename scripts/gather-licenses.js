const { promises: fs } = require('fs');
const path = require('path');
const { createRequire } = require('module');
const findUp = require('find-up');
const crypto = require('crypto');
const util = require('util');
const relevantPackageKeys = [
  'name',
  'version',
  'license',
  'licenses',
  'dependencies',
  'optionalDependencies',
  'private',
  'licenseFiles',
];
const licenseRegexp = /^(license|copyright|copying)/i;
// Return the package.json file and license files for a given package.
async function getPackageInfo(packagePath) {
  const packageJSONPath = path.join(packagePath, 'package.json');
  let packageJSON;
  try {
    packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf8'));
  } catch (e) {
    throw new Error(`Could not read ${packageJSONPath}: ${e.message}`);
  }
  // Normalize the 'contributors' list.
  packageJSON.contributors = [
    ...new Set([packageJSON.author, packageJSON.contributors].flat()),
  ].filter(Boolean);
  const licenseFiles = await Promise.all(
    (
      await fs.readdir(packagePath)
    )
      .filter((filename) => filename.match(licenseRegexp))
      .sort()
      .map(async (filename) => ({
        filename,
        content: await fs.readFile(path.join(packagePath, filename), 'utf8'),
      }))
  );
  return {
    ...packageJSON,
    path: packagePath,
    licenseFiles,
  };
}
// Recursively look up dependencies of a package at `startPath`, and return
// the package information for all of these packages.
// Each package name + version combination is only reported once.
async function gatherLicenses(startPath) {
  const packages = new Map();
  packages.set(startPath, await getPackageInfo(startPath));
  for (const pkg of packages.values()) {
    const require = createRequire(path.resolve(pkg.path, 'index.js'));
    for (const depsKey of ['dependencies', 'optionalDependencies']) {
      for (const dep of Object.keys(pkg[depsKey] || {})) {
        let resolved;
        try {
          resolved = require.resolve(dep);
          if (!path.isAbsolute(resolved)) {
            continue; // Node.js builtin
          }
        } catch (err) {
          resolved = await findUp(
            async (directory) => {
              const candidate = path.join(
                directory,
                'node_modules',
                dep,
                'package.json'
              );
              return (await findUp.exists(candidate)) ? candidate : undefined;
            },
            { cwd: path.resolve(pkg.path) }
          );
        }
        if (!resolved) {
          if (depsKey === 'optionalDependencies') {
            continue;
          }
          throw new Error(`Could not resolve ${dep} require from ${pkg.path}`);
        }
        const pkgJson = await findUp(
          async (directory) => {
            const candidate = path.join(directory, 'package.json');
            try {
              const { name, version } = require(candidate);
              // Make sure that package.json that we found has the bare
              // minimum of required package.json keys
              if (name && version) {
                return candidate;
              }
            } catch (e) {
              // Ignore errors, just return undefined to continue
              // traversal
            }
          },
          { cwd: path.dirname(resolved) }
        );
        if (!pkgJson) {
          throw new Error(
            `Could not find package.json for ${dep} required from ${pkg.path}`
          );
        }
        const pkgBase = path.relative(
          process.cwd(),
          await fs.realpath(path.dirname(pkgJson))
        );
        if (!packages.has(pkgBase)) {
          packages.set(pkgBase, await getPackageInfo(pkgBase));
        }
      }
    }
  }
  // Deduplicate by package name and version.
  const packageByNameAndVersion = new Map();
  for (const pkg of packages.values()) {
    const nameAndVersion = id(pkg);
    const existing = packageByNameAndVersion.get(nameAndVersion);
    if (existing) {
      if (!pkgEqual(pkg, existing)) {
        throw new Error(
          `Two entries for the same package name and version differ! (${JSON.stringify(
            [pkg, existing]
          )})`
        );
      }
    } else {
      packageByNameAndVersion.set(nameAndVersion, pkg);
    }
  }
  return [...packageByNameAndVersion.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
// Helper function for making sure that if we do encounter a package twice,
// the package information roughly match.
function pkgEqual(a, b) {
  for (const key of relevantPackageKeys) {
    if (!util.isDeepStrictEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}
// Generatex a hex id for any package name + version combination.
function id(pkg) {
  return crypto
    .createHash('sha256')
    .update(`${pkg.name}@${pkg.version}`)
    .digest('hex');
}
// Return a short summary of a package's licensing information.
function shortlicense(pkg) {
  if (typeof pkg.license === 'string') {
    return pkg.license;
  }
  if (typeof (pkg.license && pkg.license.type) === 'string') {
    return pkg.license.type;
  }
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses
      .map(({ type }) => type)
      .filter(Boolean)
      .join(', ');
  }
  return `See [details](#${id(pkg)})`;
}
function indent(input, depth) {
  return input.replace(/^/gm, ' '.repeat(depth));
}
// Generate a markdown file containing information about all the packages'
// licensing data.
function generateLicenseInformation(productName, packages) {
  let output = `\
The following third-party software is used by and included in **${productName}**.
This document was automatically generated on ${new Date().toDateString()}.

## List of dependencies

Package|Version|License
-------|-------|-------
${packages
  .map(
    (pkg) =>
      `**[${pkg.name}](#${id(pkg)})**|${pkg.version}|${shortlicense(pkg)}`
  )
  .join('\n')}

## Package details
`;
  for (const pkg of packages) {
    const linkedPackageName = pkg.private
      ? pkg.name
      : `[${pkg.name}](https://www.npmjs.com/package/${pkg.name})`;
    output += `
<a id="${id(pkg)}"></a>
### ${linkedPackageName} (version ${pkg.version})
<!-- initially found at ${pkg.path} -->
`;
    if (pkg.description) {
      output += `> ${pkg.description}\n\n`;
    }
    output += `License tags: ${shortlicense(pkg)}\n\n`;
    if ((pkg.licenseFiles || '').length) {
      output += 'License files:\n';
      for (const file of pkg.licenseFiles) {
        output += `* ${file.filename}:\n\n${indent(file.content, 6)}\n\n`;
      }
    }
    if ((pkg.contributors || '').length) {
      output += 'Authors:\n';
      for (const person of pkg.contributors) {
        const name =
          typeof person !== 'object'
            ? person
            : person.name +
              (person.email ? ` <[${person.email}](nomail)>` : '') +
              (person.url ? ` (${person.url})` : '');
        output += `* ${name}\n`;
      }
      output += '\n';
    }
  }
  return output;
}
// Usage: ts-node gather-licenses.ts <path/to/initial/package>
(async () => {
  const packageTree = await gatherLicenses(process.argv[2]);
  const output = generateLicenseInformation('compass', packageTree);
  process.stdout.write(output);
})().catch((err) =>
  process.nextTick(() => {
    throw err;
  })
);
