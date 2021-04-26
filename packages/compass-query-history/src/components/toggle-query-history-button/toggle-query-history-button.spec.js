import React from 'react';
import { shallow } from 'enzyme';
import FontAwesome from 'react-fontawesome';
import ToggleQueryHistoryButton from 'components/toggle-query-history-button';

import styles from './toggle-query-history-button.less';

describe('ToggleQueryHistoryButton [Component]', () => {
  describe('#rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<ToggleQueryHistoryButton />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders a button', () => {
      const node = component.find('[data-test-id="query-history-button"]');
      expect(node).to.have.length(1);
    });

    it('the button has the correct classnames', () => {
      const node = component.find('[data-test-id="query-history-button"]');
      expect(node.hasClass(styles.component)).to.equal(true);
    });

    it('renders the correct icon for the button', () => {
      const node = component.find('[data-test-id="query-history-button-icon"]');

      expect(node).to.have.type(FontAwesome);
      expect(node.prop('name')).to.equal('history');
    });
  });
});
