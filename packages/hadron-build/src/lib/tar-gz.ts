import tar from 'tar';
import path from 'path';

export default async function tarGz(
  srcDirectory: string,
  dest: string
): Promise<string> {
  await tar.create(
    {
      file: dest,
      cwd: path.dirname(srcDirectory),
      portable: true,
      gzip: true,
    },
    [path.basename(srcDirectory)]
  );

  return dest;
}
