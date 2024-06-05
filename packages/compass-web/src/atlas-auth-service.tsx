import React from 'react';
import {
  AtlasAuthService,
  AtlasAuthServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/provider';

class AtlasCloudAuthService extends AtlasAuthService {
  signIn() {
    return this.getUserInfo();
  }
  signOut() {
    return Promise.resolve();
  }
  isAuthenticated() {
    return Promise.resolve(true);
  }
  getUserInfo(): Promise<AtlasUserInfo> {
    throw new Error('AtlasCloudAuthService.getUserInfo not implemented');
  }
  getAuthHeaders() {
    return Promise.resolve({});
  }
}

const atlasAuthService = new AtlasCloudAuthService();

export function AtlasCloudAuthServiceProvider({
  children,
}: {
  children: React.ReactChild;
}) {
  return (
    <AtlasAuthServiceProvider value={atlasAuthService}>
      {children}
    </AtlasAuthServiceProvider>
  );
}
