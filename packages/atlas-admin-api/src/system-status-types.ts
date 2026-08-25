/**
 * Subset of the Atlas Admin API system status object (`GET /api/atlas/v2`) that
 * we consume: the public IP address the request originated from (always
 * returned) and, when the request is authenticated as a user rather than an API
 * key, the user making it.
 */
export type AtlasSystemStatus = {
  ipAddress: string;
  user?: { username: string };
};

export function assertSystemStatus(
  json: unknown
): asserts json is AtlasSystemStatus {
  const status = json as { ipAddress?: unknown; user?: { username?: unknown } };
  if (
    !json ||
    typeof json !== 'object' ||
    typeof status.ipAddress !== 'string'
  ) {
    throw new Error(
      'Got unexpected backend response for Atlas Admin API system status request, missing or malformed ipAddress'
    );
  }
  if (
    status.user !== undefined &&
    (typeof status.user !== 'object' ||
      status.user === null ||
      typeof status.user.username !== 'string')
  ) {
    throw new Error(
      'Got unexpected backend response for Atlas Admin API system status request, missing or malformed username'
    );
  }
}
