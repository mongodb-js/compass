import React from 'react';
import { shallow } from 'enzyme';
import FontAwesome from 'react-fontawesome';
import { expect } from 'chai';

import ToggleQueryHistoryButton from '../toggle-query-history-button';

import styles from './toggle-query-history-button.module.less';

describe('ToggleQueryHistoryButton [Component]', function() {
  describe('#rendering', function() {
    let component;

    beforeEach(function() {
      component = shallow(<ToggleQueryHistoryButton />);
    });

    afterEach(function() {
      component = null;
    });

    it('renders a button', function() {
      const node = component.find('[data-test-id="query-history-button"]');
      expect(node).to.have.length(1);
    });

    it('the button has the correct classnames', function() {
      const node = component.find('[data-test-id="query-history-button"]');
      expect(node.hasClass(styles.component)).to.equal(true);
    });

    it('renders the correct icon for the button', function() {
      const node = component.find('[data-test-id="query-history-button-icon"]');

      expect(node).to.have.type(FontAwesome);
      expect(node.prop('name')).to.equal('history');
    });
  });
});
