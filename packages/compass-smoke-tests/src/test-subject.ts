import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { type SmokeTestsContextWithSandbox } from './context';

import {
  type PackageDetails,
  readPackageDetails,
  writeAndReadPackageDetails,
} from './build-info';
import { downloadFile } from './downloads';

type TestSubjectDetails = PackageDetails & {
  /**
   * Is the package unsigned?
   * In which case we'll expect auto-updating to fail.
   */
  unsigned?: boolean;
};

type TestSubject = TestSubjectDetails & {
  filepath: string;
};
/**
 * Either uses the local package details or calculates it
 */
export function getTestSubjectDetails(
  context: SmokeTestsContextWithSandbox
): TestSubjectDetails {
  if (context.localPackage) {
    const compassDistPath = path.resolve(
      __dirname,
      '../../packages/compass/dist'
    );
    const buildInfoPath = path.resolve(compassDistPath, 'target.json');
    assert(
      fs.existsSync(buildInfoPath),
      `Expected '${buildInfoPath}' to exist`
    );
    const details = readPackageDetails(context.package, buildInfoPath);
    return {
      ...details,
      unsigned: true,
    };
  } else {
    return writeAndReadPackageDetails(context);
  }
}

/**
 * Either finds the local package or downloads the package
 */
export async function getTestSubject(
  context: SmokeTestsContextWithSandbox
): Promise<TestSubject> {
  const subject = getTestSubjectDetails(context);
  if (context.localPackage) {
    const compassDistPath = path.resolve(
      __dirname,
      '../../packages/compass/dist'
    );
    return {
      ...subject,
      filepath: path.resolve(compassDistPath, subject.filename),
    };
  } else {
    assert(
      context.bucketName !== undefined && context.bucketKeyPrefix !== undefined,
      'Bucket name and key prefix are needed to download'
    );

    const filepath = await downloadFile({
      url: `https://${context.bucketName}.s3.amazonaws.com/${context.bucketKeyPrefix}/${subject.filename}`,
      targetFilename: subject.filename,
      clearCache: context.forceDownload,
    });

    return { ...subject, filepath };
  }
}
