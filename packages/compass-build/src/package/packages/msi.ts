import type { MSICreatorOptions } from '@mongodb-js/electron-wix-msi';
import { MSICreator } from '@mongodb-js/electron-wix-msi';

export type MsiOptions = MSICreatorOptions;

export async function msi(options: MSICreatorOptions): Promise<void> {
  const msiCreator = new MSICreator(options);
  await msiCreator.create();
  await msiCreator.compile();
}
