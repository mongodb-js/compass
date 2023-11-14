import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { InstanceComponent } from './instance';
import { InstanceTabsProvider } from './instance-tabs-provider';

const testText = 'Testing';

class Databases extends React.Component {
  render() {
    return <div id="test">{testText}</div>;
  }
}

const ROLE = {
  name: 'Databases',
  component: Databases,
};

describe('Database [Component]', function () {
  describe('when status is ready', function () {
    beforeEach(function () {
      render(
        <InstanceTabsProvider tabs={[ROLE]}>
          <InstanceComponent
            instanceInfoLoadingStatus="ready"
            isDataLake={false}
            instanceInfoLoadingError={null}
            onTabClick={() => {
              /* noop */
            }}
            activeTabName={ROLE.name}
          />
        </InstanceTabsProvider>
      );
    });

    it('renders the tabs', function () {
      expect(screen.getByText(testText)).to.be.visible;
    });
  });

  describe('when status is error', function () {
    beforeEach(function () {
      render(
        <InstanceComponent
          instanceInfoLoadingStatus="error"
          isDataLake={false}
          instanceInfoLoadingError="Pineapple"
          onTabClick={() => {
            /* noop */
          }}
          activeTabName={null}
        />
      );
    });

    it('renders the error message', function () {
      expect(
        screen.getByText(
          'An error occurred while loading instance info: Pineapple'
        )
      ).to.be.visible;
    });

    it('does not renders the tabs', function () {
      expect(screen.queryByText(testText)).to.not.exist;
    });
  });
});
