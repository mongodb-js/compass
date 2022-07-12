import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { CardBody } from '../card';
import styles from './card.module.less';

describe('CardBody [Component]', function() {
  describe('#rendering', function() {
    let component;

    beforeEach(function() {
      component = shallow(<CardBody className="foo"><span>Test</span></CardBody>);
    });

    afterEach(function() {
      component = null;
    });

    it('should be a stateless function', function() {
      expect(CardBody).to.be.a('function');
    });

    it('renders the correct className on the root node', function() {
      const node = component.find(`.${styles['component-body']}`);
      expect(node).to.have.length(1);
    });

    it('renders the className passed to it', function() {
      const node = component.find('.foo');
      expect(node).to.have.length(1);
    });

    it('renders children passed to it', function() {
      const node = component.find('span');
      expect(node).to.have.length(1);
      expect(node).to.have.text('Test');
    });
  });
});
