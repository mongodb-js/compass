import path from 'path';

export type Paths = {
  src: string;
  packagerSrc: string;
  packagerDest: string;
  dest: string;
};

export function getPackagePaths(sourcePath: string): Paths {
  sourcePath = path.resolve(sourcePath);

  return {
    src: sourcePath,
    packagerSrc: path.resolve(sourcePath, 'packager', 'src'),
    packagerDest: path.resolve(sourcePath, 'packager', 'out'),
    dest: path.resolve(sourcePath, 'dist'),
  };
}
