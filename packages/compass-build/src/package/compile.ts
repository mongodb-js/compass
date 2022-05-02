import execa from 'execa';

type CompileOptions = {
  version: string;
  distribution: string;
  name: string;
  productName: string;
  channel: string;
  autoUpdateEndpoint: string;
};

export async function compile(
  sourcePath: string,
  options: CompileOptions
): Promise<void> {
  const hadronEnvConfig: typeof process.env = {
    HADRON_APP_VERSION: options.version,
    HADRON_DISTRIBUTION: options.distribution,
    HADRON_PRODUCT: options.name,
    HADRON_PRODUCT_NAME: options.productName,
    HADRON_READONLY: String(options.distribution === 'compass-readonly'),
    HADRON_ISOLATED: String(options.distribution === 'compass-isolated'),
    HADRON_CHANNEL: options.channel,
    HADRON_AUTO_UPDATE_ENDPOINT: options.autoUpdateEndpoint,
  };

  await execa('npm', ['run', 'compile'], {
    cwd: sourcePath,
    stdio: 'inherit',
    env: hadronEnvConfig,
    extendEnv: true,
  });
}
