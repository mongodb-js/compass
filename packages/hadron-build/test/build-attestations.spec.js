/* eslint-disable mocha/max-top-level-suites */
'use strict';
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const {
  getBuildVersion,
  getBuildSpecificAttestations,
  getPlatformSpecificAttestations,
  buildVariants,
} = require('../lib/build-attestations');
const Target = require('../lib/target');

describe('build-attestations', function () {
  const ROOT = path.resolve(__dirname, '..', '..');
  const VERSION = '1.2.3';
  context('getBuildVersion', function () {
    it('should return version if its set', function () {
      expect(getBuildVersion('2.3.4')).to.equal('2.3.4');
    });
    it('should return version from HADRON_APP_VERSION when its not set', function () {
      const initialHadronAppVersion = process.env.HADRON_APP_VERSION;
      process.env.HADRON_APP_VERSION = '2.3.5';
      expect(getBuildVersion()).to.equal('2.3.5');
      process.env.HADRON_APP_VERSION = initialHadronAppVersion;
    });
    it('should return version from DEV_VERSION_IDENTIFIER when its on dev channel', function () {
      const initialDevVersionIdentifier = process.env.DEV_VERSION_IDENTIFIER;
      process.env.DEV_VERSION_IDENTIFIER = '2.3.5-dev.10';
      expect(getBuildVersion('2.3.5-dev.10')).to.equal('2.3.5-dev.10');
      process.env.DEV_VERSION_IDENTIFIER = initialDevVersionIdentifier;
    });
    it('should does not account DEV_VERSION_IDENTIFIER when its not on dev channel', function () {
      const initialDevVersionIdentifier = process.env.DEV_VERSION_IDENTIFIER;
      process.env.DEV_VERSION_IDENTIFIER = '2.3.5-dev.10';
      expect(getBuildVersion('1.1.1')).to.equal('1.1.1');
      process.env.DEV_VERSION_IDENTIFIER = initialDevVersionIdentifier;
    });
  });
  context('getBuildSpecificAttestations', function () {
    it('should return correct list of general attestations', function () {
      const attestations = getBuildSpecificAttestations(ROOT, VERSION);
      const expectedFiles = [
        'dependencies.json',
        'snyk-test-result.json',
        'vulnerability-report.md',
        'static-analysis-report.tgz',
      ];
      expect(attestations).to.have.lengthOf(expectedFiles.length);

      for (const file of expectedFiles) {
        const attestation = attestations.find((a) => a.downloadKey === file);
        expect(attestation).to.exist;
        expect(attestation).to.have.property('downloadKey', file);
        expect(attestation).to.have.property(
          'uploadKey',
          path.join(VERSION, file)
        );
        expect(attestation).to.have.property(
          'localPath',
          path.join(ROOT, 'dist', file)
        );
      }
    });
  });
  context('getPlatformSpecificAttestations', function () {
    it('should return correct list of general attestations', function () {
      const attestations = getPlatformSpecificAttestations(ROOT, VERSION);
      const files = [
        'purls.txt',
        'sbom-lite.json',
        'sbom.json',
        'first-party-deps.json',
      ];

      const expectedFiles = files.flatMap((file) => {
        return Target.supportedDistributions.flatMap((distro) => {
          return buildVariants.map((variant) => {
            return path.join(`${distro}-${variant}`, file);
          });
        });
      });
      expect(attestations).to.have.lengthOf(expectedFiles.length);

      for (const file of expectedFiles) {
        const attestation = attestations.find((a) => a.downloadKey === file);
        expect(attestation).to.exist;
        expect(attestation).to.have.property('downloadKey', file);
        expect(attestation).to.have.property(
          'uploadKey',
          path.join(VERSION, file)
        );
        expect(attestation).to.have.property(
          'localPath',
          path.join(ROOT, 'dist', file)
        );
      }
    });
  });
});
