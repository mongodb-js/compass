import React from 'react';
import { mount } from 'enzyme';

import { INITIAL_STATE as COLUMNS } from 'modules/columns';
import DatabasesTable from 'components/databases-table';

describe('DatabasesTable [Component]', () => {
  const databases = [];
  let component;
  let resetSpy;
  let sortDatabasesSpy;
  let showDatabaseSpy;
  let toggleIsVisibleSpy;
  let changeDatabaseNameSpy;

  beforeEach(() => {
    resetSpy = sinon.spy();
    sortDatabasesSpy = sinon.spy();
    showDatabaseSpy = sinon.spy();
    toggleIsVisibleSpy = sinon.spy();
    changeDatabaseNameSpy = sinon.spy();
    component = mount(
      <DatabasesTable
        columns={COLUMNS}
        databases={databases}
        isWritable
        isReadonly={false}
        sortOrder="asc"
        sortColumn="Database Name"
        reset={resetSpy}
        sortDatabases={sortDatabasesSpy}
        showDatabase={showDatabaseSpy}
        changeDatabaseName={changeDatabaseNameSpy}
        toggleIsVisible={toggleIsVisibleSpy} />
    );
  });

  afterEach(() => {
    component = null;
    resetSpy = null;
    sortDatabasesSpy = null;
    showDatabaseSpy = null;
    toggleIsVisibleSpy = null;
    changeDatabaseNameSpy = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('.column-container')).to.be.present();
  });

  it('renders the correct wrapper classname', () => {
    expect(component.find('.main')).to.be.present();
  });
});
