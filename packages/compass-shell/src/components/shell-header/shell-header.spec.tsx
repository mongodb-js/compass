import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { ShellHeader } from './shell-header';

function renderShellHeader(
  props: Partial<React.ComponentProps<typeof ShellHeader>> = {}
) {
  return render(
    <ShellHeader
      isExpanded={false}
      darkMode
      isOperationInProgress={false}
      onShellToggleClicked={() => {}}
      showInfoModal={() => {}}
      {...props}
    />
  );
}

describe('ShellHeader', function () {
  context('when isExpanded prop is true', function () {
    beforeEach(function () {
      renderShellHeader({
        isExpanded: true,
      });
    });

    it('renders a close chevron button', function () {
      expect(screen.getByTestId('shell-toggle-button-close')).to.be.visible;
    });

    it('renders an info button', function () {
      expect(screen.getByTestId('shell-info-button')).to.be.visible;
    });

    it('does not render the loader', function () {
      expect(screen.queryByTestId('shell-operation-in-progress')).to.not.exist;
    });
  });

  context('when isExpanded prop is false', function () {
    beforeEach(function () {
      renderShellHeader({
        isExpanded: false,
      });
    });

    it('renders an open chevron button', function () {
      expect(screen.getByTestId('shell-toggle-button-open')).to.be.visible;
    });

    it('does not render the loader', function () {
      expect(screen.queryByTestId('shell-operation-in-progress')).to.not.exist;
    });

    it('renders title with guide cue', function () {
      expect(screen.getByTestId('shell-expand-button')).to.be.visible;
    });
  });

  context(
    'when isExpanded is false and isOperationInProgress is true',
    function () {
      it('renders the loader', function () {
        renderShellHeader({
          isExpanded: false,
          isOperationInProgress: true,
        });

        expect(screen.getByTestId('shell-operation-in-progress')).to.be.visible;
      });
    }
  );

  context('when rendered', function () {
    it('has a button to toggle the container', function () {
      renderShellHeader({
        isExpanded: false,
        isOperationInProgress: false,
      });

      expect(screen.getByTestId('shell-expand-button')).to.be.visible;
    });
  });
});
