import React from 'react';
import {
  AtlasAuthService,
  AtlasAuthServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/provider';

// Shell implementation of the AtlasAuthService for the cloud build of Compass:
// in the cloud the user is always already authenticated by Atlas itself.
// This exists so that compass-web can mount the same AtlasAuthPlugin as
// compass-desktop does.
export class AtlasCloudAuthService extends AtlasAuthService {
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
    return Promise.resolve({ sub: '' });
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
