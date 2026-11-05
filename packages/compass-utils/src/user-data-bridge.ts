/**
 * How the desktop renderer reaches Compass's local user data: the preload
 * script exposes a `UserDataBridge` on the window, and main answers its
 * requests on `USER_DATA_CHANNEL`.
 */

export const USER_DATA_CHANNEL = 'compass:user-data';

/** The window property the preload script puts the bridge on */
export const USER_DATA_BRIDGE = 'compassUserData';

/** A user-data request as plain data, so it can cross IPC or a contextBridge */
export type UserDataRequest = {
  method: string;
  url: string;
  body?: string;
};

export type UserDataResponse = {
  status: number;
  body: string;
};

export type UserDataBridge = {
  request(request: UserDataRequest): Promise<UserDataResponse>;
};

/** Requests arrive from the renderer, so main checks their shape first */
export function isUserDataRequest(value: unknown): value is UserDataRequest {
  const { method, url, body } = (value ?? {}) as Record<string, unknown>;
  return (
    typeof method === 'string' &&
    typeof url === 'string' &&
    (body === undefined || typeof body === 'string')
  );
}
