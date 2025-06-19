import React from 'react';
import { testingLibrary } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { ContextMenuProvider } from './context-menu-provider';
import type { ContextMenuWrapperProps } from './types';

// We need to import from testing-library-compass directly to avoid the extra wrapping.
const { render } = testingLibrary;

describe('ContextMenuProvider', function () {
  const TestMenu: React.FC<ContextMenuWrapperProps> = () => (
    <div data-testid="test-menu">Test Menu</div>
  );

  const TestComponent = () => (
    <div data-testid="test-content">Test Content</div>
  );

  describe('when nested', function () {
    it('throws an error when providers are nested', function () {
      expect(() => {
        render(
          <ContextMenuProvider menuWrapper={TestMenu}>
            <div>
              <ContextMenuProvider menuWrapper={TestMenu}>
                <TestComponent />
              </ContextMenuProvider>
            </div>
          </ContextMenuProvider>
        );
      }).to.throw(
        'Duplicated ContextMenuProvider found. Please remove the nested provider.'
      );
    });
  });

  describe('when not nested', function () {
    it('renders without error', function () {
      render(
        <ContextMenuProvider menuWrapper={TestMenu}>
          <TestComponent />
        </ContextMenuProvider>
      );

      expect(document.querySelector('[data-testid="test-content"]')).to.exist;
    });
  });
});
