/**
 * Note: The endpoints are versioned independently, so you might need to override the default version for a specific request.
 * See [Atlas API versioning overview](https://www.mongodb.com/docs/atlas/api/versioned-api-overview/#std-label-api-versioning-overview)
 */
export const ATLAS_ADMIN_API_DEFAULT_VERSION = '2025-03-12';

export function getAtlasAdminApiAcceptHeader(
  version: string = ATLAS_ADMIN_API_DEFAULT_VERSION
): string {
  return `application/vnd.atlas.${version}+json`;
}
