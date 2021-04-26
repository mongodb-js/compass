import React from 'react';
import { shallow, mount } from 'enzyme';

import { ViewSwitcher } from 'hadron-react-components';
import Header from 'components/header';
import styles from './header.less';

describe('Header [Component]', () => {
  let actions;

  beforeEach(() => {
    actions = {
      showRecent: sinon.stub(),
      showFavorites: sinon.stub(),
      collapse: sinon.stub()
    };
  });

  afterEach(() => {
    actions = null;
  });

  describe('#rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<Header actions={actions} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root className', () => {
      const node = component.find(`.${styles.component}`);
      expect(node).to.have.length(1);
    });

    it('renders a ViewSwitcher component', () => {
      const node = component.find(ViewSwitcher);
      expect(node).to.have.length(1);
    });

    it('renders a close button', () => {
      const node = component.find('[data-test-id="query-history-button-close-panel"]');
      expect(node).to.have.length(1);
    });
  });

  describe('#behavior', () => {
    let component;

    it('should close the query history side bar when the close button is clicked', () => {
      component = shallow(<Header actions={actions} showing="recent" />);
      const node = component.find('[data-test-id="query-history-button-close-panel"]').hostNodes();

      node.simulate('click');
      actions.collapse.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });

    describe('when viewing the Recent Queries tab', () => {
      beforeEach(() => {
        component = mount(<Header actions={actions} showing="recent" />);
      });

      afterEach(() => {
        component = null;
      });

      it('it should switch to the favorites tab when the Favorites button is clicked', () => {
        const node = component.find({ 'data-test-id': 'undefined-favorites' }).hostNodes();

        node.simulate('click');
        actions.showFavorites.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
      });

      it('it should be a no-op twhen the Recents button is clicked', () => {
        const node = component.find({ 'data-test-id': 'undefined-recent' }).hostNodes();

        node.simulate('click');
        actions.showFavorites.should.not.have.been.calledOnce; // eslint-disable-line no-unused-expressions
      });
    });

    describe('when viewing the Favorites tab', () => {
      beforeEach(() => {
        component = mount(<Header actions={actions} showing="favorites" />);
      });

      afterEach(() => {
        component = null;
      });

      it('it should switch to the recent tab when the Recents button is clicked', () => {
        const node = component.find({ 'data-test-id': 'undefined-recent' }).hostNodes();

        node.simulate('click');
        actions.showRecent.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
      });

      it('it should be a no-op twhen the Favorites button is clicked', () => {
        const node = component.find({ 'data-test-id': 'undefined-favorites' }).hostNodes();

        node.simulate('click');
        actions.showRecent.should.not.have.been.calledOnce; // eslint-disable-line no-unused-expressions
      });
    });
  });
});
