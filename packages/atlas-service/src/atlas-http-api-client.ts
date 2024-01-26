import type { AtlasUserInfo } from './util';

export interface AtlasHttpApiClient {
  getCurrentUser(): AtlasUserInfo;

  privateUnAuthEndpoint(path: string): string;

  privateAtlasEndpoint(path: string): string;

  fetch(url: string, init?: RequestInit): Promise<Response>;

  fetchJson<T>(url: string, init?: RequestInit): Promise<T>;

  unAuthenticatedFetch(url: string, init?: RequestInit): Promise<Response>;

  unAuthenticatedFetchJson<T>(url: string, init?: RequestInit): Promise<T>;
}
