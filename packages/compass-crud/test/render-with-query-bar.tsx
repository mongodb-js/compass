import React, { type PropsWithChildren } from 'react';
import { render } from '@mongodb-js/testing-library-compass';
import type { PreferencesAccess } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';

export const MockQueryBarPlugin: typeof QueryBarPlugin =
  QueryBarPlugin.withMockServices({
    dataService: {
      sample() {
        return Promise.resolve([]);
      },
      getConnectionString() {
        return { hosts: [] } as any;
      },
    },
    instance: { on() {}, removeListener() {} } as any,
    favoriteQueryStorageAccess: compassFavoriteQueryStorageAccess,
    recentQueryStorageAccess: compassRecentQueryStorageAccess,
    atlasAiService: {} as any,
  });

export const renderWithQueryBar = (
  component: React.ReactElement,
  { preferences }: { preferences: PreferencesAccess }
) => {
  const queryBarProps = {};

  return render(component, {
    wrapper: ({ children }: PropsWithChildren<unknown>) => (
      <PreferencesProvider value={preferences}>
        <MockQueryBarPlugin {...(queryBarProps as any)}>
          {children}
        </MockQueryBarPlugin>
      </PreferencesProvider>
    ),
  });
};
