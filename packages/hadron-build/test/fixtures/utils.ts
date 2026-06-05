export type FixtureOpts = {
  version: string;
  arch: string;
  distribution: string;
  channel: string;
};

export function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getProductName(distribution: string, channel: string): string {
  let base: string;
  if (distribution === 'compass-isolated') {
    base = 'MongoDB Compass Isolated Edition';
  } else if (distribution === 'compass-readonly') {
    base = 'MongoDB Compass Readonly';
  } else {
    base = 'MongoDB Compass';
  }
  return channel !== 'stable' ? `${base} ${ucFirst(channel)}` : base;
}

export function getBundleId(distribution: string): string {
  if (distribution === 'compass-readonly')
    return 'com.mongodb.compass.readonly';
  if (distribution === 'compass-isolated')
    return 'com.mongodb.compass.isolated';
  return 'com.mongodb.compass';
}

export function getNuggetVersion(version: string, channel: string): string {
  return version.replace(new RegExp(`-${channel}\\.(\\d+)`), `-${channel}$1`);
}
