import { DownloadCenter as DownloadCenterClass } from '@mongodb-js/dl-center';
import * as fs from 'fs';
import path from 'path';

const ARTIFACTS_BUCKET = 'downloads.10gen.com';
const ARTIFACTS_BUCKET_PREFIX = 'compass';

export async function uploadArtifactToDownloadCenter(
  filePath: string,
  DownloadCenter: typeof DownloadCenterClass = DownloadCenterClass
): Promise<void> {
  if (!process.env.CI) {
    throw new Error('Artifacts can only be uploaded in CI');
  }

  if (
    !process.env.DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID ||
    !process.env.DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      `'DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID' and 'DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY' must be set.`
    );
  }

  const downloadCenter = new DownloadCenter({
    bucket: ARTIFACTS_BUCKET,
    accessKeyId: process.env.DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY,
  });

  await downloadCenter.uploadAsset(
    `${ARTIFACTS_BUCKET_PREFIX}/${path.basename(filePath)}`,
    fs.createReadStream(filePath)
  );
}
