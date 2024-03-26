import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ActiveConnection } from './active-connection';
import Sinon from 'sinon';

const mockConnection: ConnectionInfo & { title: string } = {
  id: 'turtle',
  connectionOptions: {
    connectionString: 'mongodb://turtle',
  },
  savedConnectionType: 'recent',
  title: 'Elisabeth',
};

describe('<ActiveConnectionList />', function () {
  let toggleSpy: Sinon.SinonSpy;

  beforeEach(() => {
    toggleSpy = Sinon.spy();
  });

  afterEach(() => {
    toggleSpy.resetHistory();
  });

  it('Should render the title', function () {
    render(
      <ActiveConnection
        isExpanded={false}
        connection={mockConnection}
        onToggle={toggleSpy}
      />
    );
    expect(screen.queryByText('Elisabeth')).to.be.visible;
  });

  it('Click on the title should call onToggle(true)', function () {
    render(
      <ActiveConnection
        isExpanded={false}
        connection={mockConnection}
        onToggle={toggleSpy}
      />
    );
    const title = screen.queryByText('Elisabeth');
    title?.click();
    expect(toggleSpy).to.have.been.calledWith(true);
  });

  it('Click on the collapse button should call onToggle(false)', function () {
    render(
      <ActiveConnection
        isExpanded={true}
        connection={mockConnection}
        onToggle={toggleSpy}
      />
    );
    const collapseBtn = screen.queryByLabelText('Collapse');
    expect(collapseBtn).to.be.visible;
    collapseBtn?.click();
    expect(toggleSpy).to.have.been.calledWith(false);
  });
});
