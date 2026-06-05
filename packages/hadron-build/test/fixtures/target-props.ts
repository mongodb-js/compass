import { resolvePath } from '../test-helpers';
import {
  type FixtureOpts,
  getBundleId,
  getProductName,
  getSlug,
} from './utils';

type TargetPropsOpts = FixtureOpts & { platform: string };

export function getExpectedTargetProps({
  version,
  arch,
  distribution,
  channel,
  platform,
}: TargetPropsOpts) {
  const productName = getProductName(distribution, channel);
  const bundleId = getBundleId(distribution);
  const slug = getSlug(distribution, channel);

  return {
    dir: resolvePath('./'),
    out: resolvePath('dist'),
    distribution,
    id: `mongodb-${distribution}`,
    name: `mongodb-${distribution}`,
    readonly: distribution === 'compass-readonly',
    isolated: distribution === 'compass-isolated',
    productName,
    bundleId,
    version,
    installerVersion: undefined,
    platform,
    arch,
    description: 'The MongoDB GUI',
    author: 'MongoDB Inc',
    shortcutFolderName: 'MongoDB',
    programFilesFolderName: undefined,
    slug,
    channel,
    autoUpdateBaseUrl: 'https://compass.mongodb.com',
    macosEntitlements: resolvePath('scripts/macos-entitlements.xml'),
  };
}
