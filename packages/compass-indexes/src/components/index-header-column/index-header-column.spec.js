import React from 'react';
import { mount } from 'enzyme';

import IndexHeaderColumn from 'components/index-header-column';
import styles from './index-header-column.less';

describe('index-header-column [Component]', () => {
  let component;
  let sortSpy;
  describe('not active', () => {
    beforeEach(() => {
      sortSpy = sinon.spy();
      component = mount(<IndexHeaderColumn
        indexes={[]}
        sortOrder="fa-sort-asc"
        sortColumn="name"
        sortIndexes={sortSpy}
        dataTestId="testid"
        name="testname"
      />);
    });
    afterEach(() => {
      component = null;
      sortSpy = null;
    });
    it('renders the correct root classname', () => {
      expect(component.find('[data-test-id="testid"]')).to.be.present();
    });
    it('is inactive', () => {
      expect(component.find(`.${styles['index-header-column']}`)).to.be.present();
    });
    it('sorts when clicked on', () => {
      component.find(`.${styles['index-header-column-sort']}`).simulate('click');
      expect(sortSpy.calledOnce).to.equal(true);
      expect(sortSpy.args).to.deep.equal([[[], 'testname', 'fa-sort-desc']]);
    });
  });
  describe('active', () => {
    beforeEach(() => {
      sortSpy = sinon.spy();
      component = mount(<IndexHeaderColumn
        indexes={[]}
        sortOrder="fa-sort-desc"
        sortColumn="testname"
        sortIndexes={sortSpy}
        dataTestId="testid"
        name="testname"
      />);
    });
    afterEach(() => {
      component = null;
      sortSpy = null;
    });
    it('renders the correct root classname', () => {
      expect(component.find('[data-test-id="testid"]')).to.be.present();
    });
    it('is active', () => {
      expect(component.find(`.${styles['index-header-column-active']}`)).to.be.present();
    });
    it('sorts when clicked on', () => {
      component.find(`.${styles['index-header-column-sort']}`).simulate('click');
      expect(sortSpy.calledOnce).to.equal(true);
      expect(sortSpy.args).to.deep.equal([[[], 'testname', 'fa-sort-asc']]);
    });
  });
});
