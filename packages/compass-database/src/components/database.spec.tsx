import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import { Database } from './database';

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
    const registry = new AppRegistry();

    globalBefore = (global as any).hadronApp;
    (global as any).hadronApp = {
      appRegistry: registry,
    };

    ((global as any).hadronApp.appRegistry as AppRegistry).registerRole(
      'Database.Tab',
      ROLE
    );
    render(<Database />);
  });

  afterEach(function () {
    (global as any).hadronApp = globalBefore;
  });

  it('renders the correct roles', function () {
    expect(screen.getByText('Testing')).to.be.visible;
  });
});
