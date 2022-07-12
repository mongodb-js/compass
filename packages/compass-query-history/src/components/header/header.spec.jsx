import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { ViewSwitcher } from 'hadron-react-components';

import Header from '../header';
import styles from './header.module.less';

describe('Header [Component]', function() {
  let actions;

  beforeEach(function() {
    actions = {
      showRecent: sinon.stub(),
      showFavorites: sinon.stub(),
      collapse: sinon.stub()
    };
  });

  afterEach(function() {
    actions = null;
  });

  describe('#rendering', function() {
    let component;

    beforeEach(function() {
      component = shallow(<Header actions={actions} />);
    });

    afterEach(function() {
      component = null;
    });

    it('renders the correct root className', function() {
      const node = component.find(`.${styles.component}`);
      expect(node).to.have.length(1);
    });

    it('renders a ViewSwitcher component', function() {
      const node = component.find(ViewSwitcher);
      expect(node).to.have.length(1);
    });

    it('renders a close button', function() {
      const node = component.find('[data-test-id="query-history-button-close-panel"]');
      expect(node).to.have.length(1);
    });
  });

  describe('#behavior', function() {
    let component;

    it('should close the query history side bar when the close button is clicked', function() {
      component = shallow(<Header actions={actions} showing="recent" />);
      const node = component.find('[data-test-id="query-history-button-close-panel"]');

      node.simulate('click');
      expect(actions.collapse).to.have.been.calledOnce;
    });

    describe('when viewing the Recent Queries tab', function() {
      beforeEach(function() {
        component = mount(<Header actions={actions} showing="recent" />);
      });

      afterEach(function() {
        component = null;
      });

      it('it should switch to the favorites tab when the Favorites button is clicked', function() {
        const node = component.find({ 'data-test-id': 'past-queries-favorites' }).hostNodes();

        node.simulate('click');
        expect(actions.showFavorites).to.have.been.calledOnce;
      });

      it('it should be a no-op twhen the Recents button is clicked', function() {
        const node = component.find({ 'data-test-id': 'past-queries-recent' }).hostNodes();

        node.simulate('click');
        expect(actions.showFavorites).to.not.have.been.calledOnce;
      });
    });

    describe('when viewing the Favorites tab', function() {
      beforeEach(function() {
        component = mount(<Header actions={actions} showing="favorites" />);
      });

      afterEach(function() {
        component = null;
      });

      it('it should switch to the recent tab when the Recents button is clicked', function() {
        const node = component.find({ 'data-test-id': 'past-queries-recent' }).hostNodes();

        node.simulate('click');
        expect(actions.showRecent).to.have.been.calledOnce;
      });

      it('it should be a no-op twhen the Favorites button is clicked', function() {
        const node = component.find({ 'data-test-id': 'past-queries-favorites' }).hostNodes();

        node.simulate('click');
        expect(actions.showRecent).to.not.have.been.calledOnce;
      });
    });
  });
});
