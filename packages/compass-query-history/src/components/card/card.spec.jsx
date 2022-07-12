import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { Card } from '../card';
import styles from './card.module.less';

describe('Card [Component]', function () {
  describe('#rendering', function () {
    let component;

    beforeEach(function () {
      component = shallow(
        <Card className="foo">
          <span>Test</span>
        </Card>
      );
    });

    afterEach(function () {
      component = null;
    });

    it('should be a stateless function', function () {
      expect(Card).to.be.a('function');
    });

    it('renders the correct className on the root node', function () {
      const node = component.find(`.${styles.component}`);
      expect(node).to.have.length(1);
    });

    it('renders the className passed to it', function () {
      const node = component.find('.foo');
      expect(node).to.have.length(1);
    });

    it('renders children passed to it', function () {
      const node = component.find('span');
      expect(node).to.have.length(1);
      expect(node).to.have.text('Test');
    });
  });
});
