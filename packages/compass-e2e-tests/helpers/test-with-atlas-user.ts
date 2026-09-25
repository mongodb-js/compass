import type { CompassBrowser } from './compass-browser.ts';
import { createExternalBrowser } from './compass.ts';
import {
  assertTestingWithAtlasCloud,
  context,
  getAtlasCloudEnvironmentFromContext,
} from './test-runner-context.ts';

/**
 * Helpers for suites that need their own Atlas Cloud user (and with it an org)
 * rather than the shared one: they create it with these and provision whatever
 * else they need through the returned signed in session.
 */

export type AtlasCloudTestUser = {
  username: string;
  password: string;
  orgId: string;
  /** External browser signed in as the user, for Atlas Cloud API calls */
  session: CompassBrowser;
};

export async function createAtlasCloudTestUser(): Promise<AtlasCloudTestUser> {
  assertTestingWithAtlasCloud(context);
  const session = await createExternalBrowser(false);
  try {
    const { username, password, orgId } = await session.createAtlasLoginUser(
      getAtlasCloudEnvironmentFromContext()
    );
    return { username, password, orgId, session };
  } catch (err) {
    // The caller never gets the session if we throw, so it can't clean it up
    await session.deleteSession().catch(() => {});
    throw err;
  }
}

export async function deleteAtlasCloudTestUser({
  username,
  session,
}: AtlasCloudTestUser) {
  await session
    .deleteAtlasUser(username, getAtlasCloudEnvironmentFromContext())
    .catch(() => {});
  await session.deleteSession().catch(() => {});
}

export async function createTestProject(
  { session, orgId }: AtlasCloudTestUser,
  name: string
): Promise<string> {
  return await session.createAtlasProject({
    env: getAtlasCloudEnvironmentFromContext(),
    orgId,
    name,
  });
}
