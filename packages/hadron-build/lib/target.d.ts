export interface Asset {
  name: string;
  path: string;
  downloadCenter?: boolean;
}

export interface TargetAssets {
  assets: Asset[];
  config: {
    distribution: string;
    arch: string;
    platform: string;
  };
}

export interface TargetOptions {
  version?: string;
  platform?: string;
  arch?: string;
}

declare class Target {
  dir: string;
  out: string;
  version: string;
  channel: string;
  platform: string;
  arch: string;
  distribution: string;
  productName: string;
  appPath: string;
  resources: string;
  resourcesAppDir: string;
  pkg: Record<string, unknown>;
  assets: Asset[];
  asar: { unpack?: string[] };
  packagerOptions: { electronVersion: string };
  rebuild: Record<string, unknown>;

  constructor(dir: string, opts?: TargetOptions);

  write(name: string, contents: string | Buffer): Promise<string>;
  createInstaller(): Promise<void>;
  distRoot(): string;
  dest(...parts: string[]): string;

  static getAssetsForVersion(dir: string, version: string): TargetAssets[];
  static getChannelFromVersion(version: string): string;
  static getDownloadLinkForAsset(version: string, asset: Asset): string;
  static readonly supportedDistributions: string[];
  static readonly supportedPlatforms: { platform: string; arch: string }[];
}

export = Target;
