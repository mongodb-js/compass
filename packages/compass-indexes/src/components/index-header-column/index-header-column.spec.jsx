import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import IndexHeaderColumn from '../index-header-column';

describe('index-header-column [Component]', function () {
  let component;
  let sortSpy;
  describe('not active', function () {
    beforeEach(function () {
      sortSpy = sinon.spy();
      component = mount(
        <IndexHeaderColumn
          indexes={[]}
          sortOrder="fa-sort-asc"
          sortColumn="name"
          sortIndexes={sortSpy}
          dataTestId="testid"
          name="testname"
        />
      );
    });
    afterEach(function () {
      component = null;
      sortSpy = null;
    });
    it('renders the correct root classname', function () {
      expect(component.find('[data-test-id="testid"]')).to.be.present();
    });
  });
  describe('active', function () {
    beforeEach(function () {
      sortSpy = sinon.spy();
      component = mount(
        <IndexHeaderColumn
          indexes={[]}
          sortOrder="fa-sort-desc"
          sortColumn="testname"
          sortIndexes={sortSpy}
          dataTestId="testid"
          name="testname"
        />
      );
    });
    afterEach(function () {
      component = null;
      sortSpy = null;
    });
    it('renders the correct root classname', function () {
      expect(component.find('[data-test-id="testid"]')).to.be.present();
    });
  });
});
