import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { Database } from './database';
import { DatabaseTabsProvider } from './database-tabs-provider';

class Collections extends React.Component {
  render() {
    return <div id="test">Testing</div>;
  }
}

const ROLE = {
  name: 'Collections',
  component: Collections,
};

describe('Database [Component]', function () {
  let globalBefore: any;
  beforeEach(function () {
    render(
      <DatabaseTabsProvider tabs={[ROLE]}>
        <Database />
      </DatabaseTabsProvider>
    );
  });

  afterEach(function () {
    (global as any).hadronApp = globalBefore;
  });

  it('renders the correct roles', function () {
    expect(screen.getByText('Testing')).to.be.visible;
  });
});
