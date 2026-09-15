import type { CompassBrowser } from './compass-browser.ts';
import { createExternalBrowser } from './compass.ts';
import {
  assertTestingDesktopWithAtlasCloud,
  context,
  getAtlasCloudEnvironmentFromContext,
} from './test-runner-context.ts';

/**
 * Helpers for desktop tests running with `--test-with-atlas-cloud`: the global
 * fixture creates one Atlas Cloud user (and org) for the run, tests provision
 * whatever else they need through these
 */

/**
 * Opens a browser signed in as the Atlas Cloud user created for this run, to
 * be used for provisioning resources through the Atlas Cloud API
 */
export async function createAtlasCloudSession(): Promise<CompassBrowser> {
  assertTestingDesktopWithAtlasCloud(context);
  const session = await createExternalBrowser(false);
  await session.signInToAtlas(
    context.atlasCloudUsername,
    context.atlasCloudPassword,
    getAtlasCloudEnvironmentFromContext()
  );
  return session;
}

export async function createTestProject(
  session: CompassBrowser,
  name: string
): Promise<string> {
  assertTestingDesktopWithAtlasCloud(context);
  return await session.createAtlasProject({
    env: getAtlasCloudEnvironmentFromContext(),
    orgId: context.atlasCloudOrgId,
    name,
  });
}
