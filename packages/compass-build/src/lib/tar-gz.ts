import tar from 'tar';
import path from 'path';

export async function tarGz(srcDirectory: string, dest: string) {
  await tar.create(
    {
      file: dest,
      cwd: path.dirname(srcDirectory),
      portable: true,
      gzip: true,
    },
    ['.']
  );

  return dest;
}
