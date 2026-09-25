import type { CompassBrowser } from '../../compass-browser.ts';
import { getCloudUrlsForEnvironment } from '../../test-runner-context.ts';
import type { AtlasEnvironment } from '../../test-runner-context.ts';
import { doCloudFetch, isAtlasCloudPage } from './utils.ts';

export async function createAtlasProject(
  browser: CompassBrowser,
  { env, orgId, name }: { env: AtlasEnvironment; orgId: string; name: string }
): Promise<string> {
  const { cloudUrl } = getCloudUrlsForEnvironment(env);

  await browser.navigateTo(cloudUrl);
  await browser.waitUntil(() => isAtlasCloudPage(browser, cloudUrl));

  const { id } = await doCloudFetch<{ id: string }>(
    browser,
    `/orgs/${orgId}/groups`,
    { method: 'POST' },
    { json: { name, tags: {} } }
  );
  return id;
}
