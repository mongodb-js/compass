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
    it('uses parent provider and does not render duplicate menu wrapper', function () {
      const { container } = render(
        <ContextMenuProvider menuWrapper={TestMenu}>
          <div>
            <ContextMenuProvider menuWrapper={TestMenu}>
              <TestComponent />
            </ContextMenuProvider>
          </div>
        </ContextMenuProvider>
      );

      // Should only find one test-menu element (from the parent provider)
      expect(
        container.querySelectorAll('[data-testid="test-menu"]')
      ).to.have.length(1);
      // Should still render the content
      expect(container.querySelector('[data-testid="test-content"]')).to.exist;
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
