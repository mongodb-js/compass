import type { CreateOptions } from 'electron-installer-dmg';
import createDMG from 'electron-installer-dmg';

export type DmgOptions = CreateOptions;

export async function dmg(options: CreateOptions): Promise<void> {
  await createDMG(options);
}
