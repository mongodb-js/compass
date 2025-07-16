import React, { createRef } from 'react';
import { axe } from 'jest-axe';

import { getTestUtils } from '../testing';
import { renderToolbar } from '../testing/render.testutils';
import { ToolbarIconButton } from '../ToolbarIconButton';

import { Toolbar } from './Toolbar';

describe('packages/toolbar', () => {
  describe('a11y', () => {
    test('does not have basic accessibility issues', async () => {
      const { container } = renderToolbar({});
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  test('renders the correct number of buttons', () => {
    renderToolbar({});
    const { getAllToolbarIconButtons } = getTestUtils();
    const buttons = getAllToolbarIconButtons();
    expect(buttons.length).toBe(5);
  });

  test('accepts a ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderToolbar({ ref });
    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  /* eslint-disable jest/no-disabled-tests */
  describe.skip('types behave as expected', () => {
    test('TextInput throws error when no label is supplied', () => {
      <>
        {/* @ts-expect-error - children are required */}
        <Toolbar />;
        <Toolbar>
          <ToolbarIconButton glyph="Code" label="Code" />
        </Toolbar>
        {/* @ts-expect-error - data-lgid should start with lg */}
        <Toolbar data-lgid="toolbar">
          <ToolbarIconButton glyph="Code" label="Code" />
        </Toolbar>
        <Toolbar data-lgid="lg-toolbar" darkMode>
          <ToolbarIconButton glyph="Code" label="Code" />
        </Toolbar>
      </>;
    });
  });
});
