import React from 'react';
import { mount } from 'enzyme';

import { INITIAL_STATE as COLUMNS } from 'modules/columns';
import DatabasesTable from 'components/databases-table';

describe('DatabasesTable [Component]', () => {
  const databases = [];
  let component;
  let sortDatabasesSpy;
  let showDatabaseSpy;
  let showDropDatabaseSpy;

  beforeEach(() => {
    sortDatabasesSpy = sinon.spy();
    showDatabaseSpy = sinon.spy();
    showDropDatabaseSpy = sinon.spy();
    component = mount(
      <DatabasesTable
        columns={COLUMNS}
        databases={databases}
        isWritable
        isReadonly={false}
        sortOrder="asc"
        sortColumn="Database Name"
        sortDatabases={sortDatabasesSpy}
        showDatabase={showDatabaseSpy}
        showDropDatabase={showDropDatabaseSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('.column-container')).to.be.present();
  });

  it('renders the correct wrapper classname', () => {
    expect(component.find('.main')).to.be.present();
  });
});
