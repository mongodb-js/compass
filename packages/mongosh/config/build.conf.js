'use strict';

const path = require('path');
const os = require('os');

/**
 * The project root.
 */
const ROOT = path.join(__dirname, '..');

/**
 * The mongosh package.
 */
const CLI_REPL_DIR = path.join(ROOT, 'packages', 'cli-repl');

/**
 * The project config.
 */
const CLI_REPL_PACKAGE_JSON = require(path.join(CLI_REPL_DIR, 'package.json'));

/**
 * The input for the build.
 */
const INPUT = path.join(CLI_REPL_DIR, 'lib', 'run.js');

/**
 * The input for the exec.
 */
const EXEC_INPUT = path.join(CLI_REPL_DIR, 'dist', 'mongosh.js');

/**
 * The output dir for the build.
 */
const OUTPUT_DIR = path.join(ROOT, 'dist');

/**
 * The name of the generated mongosh executable.
 */
const EXECUTABLE_PATH = path.join(OUTPUT_DIR, process.platform === 'win32' ? 'mongosh.exe' : 'mongosh');

/**
 * The name of the downloaded mongocryptd executable.
 * We use the name mongocryptd-mongosh to avoid conflicts with users
 * potentially installing the 'proper' mongocryptd package.
 */
const MONGOCRYPTD_PATH = path.resolve(__dirname, '..', 'tmp', 'mongocryptd-mongosh' + (process.platform === 'win32' ? '.exe' : ''));

/**
 * Analytics configuration file.
 */
const ANALYTICS_CONFIG_FILE_PATH = path.join(CLI_REPL_DIR, 'lib', 'analytics-config.js');

/**
 * The bundle id for MacOs.
 */
const APPLE_NOTARIZATION_BUNDLE_ID = 'com.mongodb.mongosh';

/**
 * The SHA for the current git HEAD.
 */
// TODO: replace with "real" SHA after EVG-13919
const REVISION = process.env.IS_PATCH ?
  `pr-${process.env.GITHUB_PR_NUMBER}-${process.env.REVISION_ORDER_ID}` :
  process.env.REVISION;

/**
 * The copyright notice for debian packages and .exe files
 */
const COPYRIGHT = `${new Date().getYear() + 1900} MongoDB, Inc.`;

/**
 * Export the configuration for the build.
 */
module.exports = {
  version: CLI_REPL_PACKAGE_JSON.version,
  rootDir: ROOT,
  input: INPUT,
  execInput: EXEC_INPUT,
  executablePath: EXECUTABLE_PATH,
  outputDir: OUTPUT_DIR,
  analyticsConfigFilePath: ANALYTICS_CONFIG_FILE_PATH,
  project: process.env.PROJECT,
  revision: REVISION,
  branch: process.env.BRANCH_NAME,
  evgAwsKey: process.env.AWS_KEY,
  evgAwsSecret: process.env.AWS_SECRET,
  downloadCenterAwsKey: process.env.DOWNLOAD_CENTER_AWS_KEY,
  downloadCenterAwsSecret: process.env.DOWNLOAD_CENTER_AWS_SECRET,
  githubToken: process.env.GITHUB_TOKEN,
  segmentKey: process.env.SEGMENT_API_KEY,
  isCi: process.env.IS_CI === 'true',
  isPatch: process.env.IS_PATCH === 'true',
  triggeringGitTag: process.env.TRIGGERED_BY_GIT_TAG,
  platform: os.platform(),
  execNodeVersion: process.env.NODE_JS_VERSION || `^${process.version.slice(1)}`,
  distributionBuildVariant: process.env.DISTRIBUTION_BUILD_VARIANT,
  appleCodesignIdentity: process.env.APPLE_CODESIGN_IDENTITY,
  appleCodesignEntitlementsFile: path.resolve(__dirname, 'macos-entitlements.xml'),
  appleNotarizationBundleId: APPLE_NOTARIZATION_BUNDLE_ID,
  appleNotarizationUsername: process.env.APPLE_NOTARIZATION_USERNAME,
  appleNotarizationApplicationPassword: process.env.APPLE_NOTARIZATION_APPLICATION_PASSWORD,
  repo: {
    owner: 'mongodb-js',
    repo: 'mongosh'
  },
  artifactUrlFile: process.env.ARTIFACT_URL_FILE,
  mongocryptdPath: MONGOCRYPTD_PATH,
  packageInformation: {
    binaries: [
      {
        sourceFilePath: EXECUTABLE_PATH,
        category: 'bin',
        license: {
          sourceFilePath: path.resolve(__dirname, '..', 'LICENSE'),
          packagedFilePath: 'LICENSE-mongosh',
          debCopyright: `${new Date().getYear() + 1900} MongoDB, Inc.`,
          debIdentifier: 'Apache-2',
          rpmIdentifier: 'ASL 2.0'
        }
      },
      {
        sourceFilePath: MONGOCRYPTD_PATH,
        category: 'libexec',
        license: {
          sourceFilePath: path.resolve(__dirname, '..', 'packaging', 'LICENSE-mongocryptd'),
          packagedFilePath: 'LICENSE-mongocryptd',
          debCopyright: COPYRIGHT,
          debIdentifier: 'Proprietary',
          rpmIdentifier: 'Proprietary'
        }
      }
    ],
    otherDocFilePaths: [
      {
        sourceFilePath: path.resolve(__dirname, '..', 'packaging', 'README'),
        packagedFilePath: 'README'
      },
      {
        sourceFilePath: path.resolve(__dirname, '..', 'THIRD_PARTY_NOTICES.md'),
        packagedFilePath: 'THIRD_PARTY_NOTICES'
      }
    ],
    metadata: {
      name: 'mongosh',
      fullName: 'MongoDB Shell',
      version: CLI_REPL_PACKAGE_JSON.version,
      description: CLI_REPL_PACKAGE_JSON.description,
      homepage: CLI_REPL_PACKAGE_JSON.homepage,
      maintainer: CLI_REPL_PACKAGE_JSON.author,
      manufacturer: CLI_REPL_PACKAGE_JSON.manufacturer,
      copyright: COPYRIGHT,
      icon: path.resolve(__dirname, '..', 'packaging', 'mongo.ico')
    },
    debTemplateDir: path.resolve(__dirname, '..', 'packaging', 'deb-template'),
    rpmTemplateDir: path.resolve(__dirname, '..', 'packaging', 'rpm-template'),
    msiTemplateDir: path.resolve(__dirname, '..', 'packaging', 'msi-template')
  }
};
