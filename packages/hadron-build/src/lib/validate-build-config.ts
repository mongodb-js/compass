import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

const IconChannelsSchema = z.object({
  stable: z.string(),
  beta: z.string(),
  dev: z.string(),
});

const Win32BuildConfigSchema = z.object({
  icon: IconChannelsSchema,
  favicon_url: z.string(),
  loading_gif: z.string(),
  background: z.string(),
  banner: z.string(),
  setup_icon: z.string().optional(),
});

const DarwinBuildConfigSchema = z.object({
  icon: IconChannelsSchema,
  dmg_background: z.string(),
  app_category_type: z.string(),
  codesign_identity: z.string().optional(),
  codesign_sha1: z.string().optional(),
  extra_plist_options: z.string().optional(),
});

const LinuxBuildConfigSchema = z.object({
  icon: IconChannelsSchema,
  deb_section: z.string(),
  rpm_categories: z.array(z.string()),
});

const DistributionSchema = z.object({
  name: z.string(),
  productName: z.string(),
  bundleId: z.string(),
  'plugins-directory': z.string(),
  upgradeCode: z.string().optional(),
  readonly: z.boolean().optional(),
  isolated: z.boolean().optional(),
});

const ProtocolSchema = z.object({
  name: z.string(),
  schemes: z.array(z.string()),
});

const HadronConfigSchema = z.object({
  endpoint: z.string().optional(),
  protocols: z.array(ProtocolSchema).optional().default([]),
  distributions: z.record(DistributionSchema),
  build: z.object({
    win32: Win32BuildConfigSchema,
    darwin: DarwinBuildConfigSchema,
    linux: LinuxBuildConfigSchema,
  }),
  asar: z
    .object({
      unpack: z.array(z.string()).optional(),
    })
    .optional(),
  rebuild: z.record(z.unknown()).optional(),
  macosEntitlements: z.string().optional(),
});

export type HadronConfig = z.infer<typeof HadronConfigSchema>;
export type Win32BuildConfig = z.infer<typeof Win32BuildConfigSchema>;
export type DarwinBuildConfig = z.infer<typeof DarwinBuildConfigSchema>;
export type LinuxBuildConfig = z.infer<typeof LinuxBuildConfigSchema>;
export type Distribution = z.infer<typeof DistributionSchema>;
export type Protocol = z.infer<typeof ProtocolSchema>;

function assertFileExists(filePath: string, label: string): void {
  if (!existsSync(filePath)) {
    throw new Error(
      `Build config references missing file for ${label}: ${filePath}`
    );
  }
}

function validateWin32Resources(
  config: Win32BuildConfig,
  projectRoot: string
): void {
  const resolve = (p: string) => path.join(projectRoot, p);
  for (const channel of ['stable', 'beta', 'dev'] as const) {
    assertFileExists(resolve(config.icon[channel]), `win32 icon.${channel}`);
  }
  assertFileExists(resolve(config.loading_gif), 'win32 loading_gif');
  assertFileExists(resolve(config.background), 'win32 background');
  assertFileExists(resolve(config.banner), 'win32 banner');
  if (config.setup_icon) {
    assertFileExists(resolve(config.setup_icon), 'win32 setup_icon');
  }
}

function validateDarwinResources(
  config: DarwinBuildConfig,
  projectRoot: string
): void {
  const resolve = (p: string) => path.join(projectRoot, p);
  for (const channel of ['stable', 'beta', 'dev'] as const) {
    assertFileExists(resolve(config.icon[channel]), `darwin icon.${channel}`);
  }
  assertFileExists(resolve(config.dmg_background), 'darwin dmg_background');
  if (config.extra_plist_options) {
    assertFileExists(
      resolve(config.extra_plist_options),
      'darwin extra_plist_options'
    );
  }
}

function validateLinuxResources(
  config: LinuxBuildConfig,
  projectRoot: string
): void {
  const resolve = (p: string) => path.join(projectRoot, p);
  for (const channel of ['stable', 'beta', 'dev'] as const) {
    assertFileExists(resolve(config.icon[channel]), `linux icon.${channel}`);
  }
}

export function parseHadronConfig(
  raw: unknown,
  projectRoot: string
): HadronConfig {
  const result = HadronConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid hadron build config:\n${issues}`);
  }

  const config = result.data;

  validateWin32Resources(config.build.win32, projectRoot);
  validateDarwinResources(config.build.darwin, projectRoot);
  validateLinuxResources(config.build.linux, projectRoot);

  if (config.macosEntitlements) {
    assertFileExists(
      path.join(projectRoot, config.macosEntitlements),
      'macosEntitlements'
    );
  }

  return config;
}
