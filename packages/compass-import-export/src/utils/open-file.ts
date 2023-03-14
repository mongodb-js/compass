export async function openFile(fileName: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
  const { shell }: typeof import('electron') = require('electron');
  return shell.openPath(fileName);
}
