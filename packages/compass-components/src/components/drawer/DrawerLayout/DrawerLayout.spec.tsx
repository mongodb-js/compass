import React from 'react';

import { DrawerLayout } from '.';

describe('packages/chip', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('types behave as expected', () => {
    <>
      {/* @ts-expect-error - Missing children */}
      <DrawerLayout />

      <DrawerLayout>{'children'}</DrawerLayout>

      <DrawerLayout displayMode="embedded">{'children'}</DrawerLayout>

      <DrawerLayout displayMode="overlay">{'children'}</DrawerLayout>

      <DrawerLayout
        toolbarData={[
          {
            id: 'code',
            glyph: 'Code',
            content: '<p>hey</p>',
            label: 'the label',
            title: 'the title',
          },
        ]}
        onClose={() => {}}
        displayMode="overlay"
        darkMode
      >
        {'children'}
      </DrawerLayout>

      <DrawerLayout isDrawerOpen={false} displayMode="embedded">
        {'children'}
      </DrawerLayout>

      {/* @ts-expect-error - ToolbarData should not be passed with isDrawerOpen */}
      <DrawerLayout
        isDrawerOpen={false}
        displayMode="embedded"
        toolbarData={[]}
      >
        {'children'}
      </DrawerLayout>
    </>;
  });
});
