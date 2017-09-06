import React from 'react';
import { shallow } from 'enzyme';

import { Card } from 'components/card';
import styles from './card.less';

describe('Card [Component]', () => {
  describe('#rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<Card className="foo"><span>Test</span></Card>);
    });

    afterEach(() => {
      component = null;
    });

    it('should be a stateless function', () => {
      expect(Card).to.be.a('function');
    });

    it('renders the correct className on the root node', () => {
      const node = component.find(`.${styles.component}`);
      expect(node).to.have.length(1);
    });

    it('renders the className passed to it', () => {
      const node = component.find('.foo');
      expect(node).to.have.length(1);
    });

    it('renders children passed to it', () => {
      const node = component.find('span');
      expect(node).to.have.length(1);
      expect(node).to.have.text('Test');
    });
  });
});
