/**
 * Note: The endpoints are versioned independently, so you might need to override the default version for a specific request.
 */
export const ATLAS_ADMIN_API_DEFAULT_VERSION = '2025-03-12';

export function getAtlasAdminApiAcceptHeader(
  version: string = ATLAS_ADMIN_API_DEFAULT_VERSION
): string {
  return `application/vnd.atlas.${version}+json`;
}
