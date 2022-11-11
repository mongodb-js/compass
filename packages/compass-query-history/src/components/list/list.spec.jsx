/*
import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';

import { listFactory } from '../list';
import styles from './list.module.less';
import { ZeroGraphic } from '../zero-graphic';

const ListComponent = listFactory(
  () => <span data-testid="mock-item" />,
  () => <div data-testid="mock-saving" />
);

describe('listFactory [Component]', function () {
  const items = [
    { _ns: 'test', _name: 'foo' },
    { _ns: 'test', _name: 'bar' },
    { _ns: 'test', _name: 'bazz' },
  ];

  describe('#rendering', function () {
    it('renders the root node with the correct className', function () {
      const component = shallow(
        <ListComponent items={items} ns={{ ns: 'test' }} actions={{}} />
      );
      const node = component.find(`.${styles.component}`);

      expect(node).to.have.length(1);
    });

    it('renders the list with the correct className', function () {
      const component = shallow(
        <ListComponent items={items} ns={{ ns: 'test' }} actions={{}} />
      );
      const node = component.find(`.${styles.items}`);

      expect(node).to.have.length(1);
    });

    describe('when there are no items to render', function () {
      it('the list is not rendered with any children', function () {
        const component = shallow(
          <ListComponent items={[]} ns={{ ns: 'test' }} actions={{}} />
        );
        const node = component.find(`.${styles.items}`);

        expect(node.children()).to.have.length(0);
      });

      it('renders a zero state title', function () {
        const component = shallow(
          <ListComponent items={[]} ns={{ ns: 'test' }} actions={{}} />
        );
        expect(component.find(ZeroGraphic)).to.exist;
      });
    });

    describe('when there are items to render', function () {
      it('the list is rendered with the correct number of children', function () {
        const component = shallow(
          <ListComponent items={items} ns={{ ns: 'test' }} actions={{}} />
        );
        const node = component.find(`.${styles.items}`);

        expect(node.children()).to.have.length(3);
      });

      it('does not render a zero state title', function () {
        const component = shallow(
          <ListComponent items={items} ns={{ ns: 'test' }} actions={{}} />
        );
        expect(component.find(ZeroGraphic)).to.not.exist;
      });
    });

    describe('when we have a current model', function () {
      it('renders a saving component', function () {
        const component = mount(
          <ListComponent
            items={items}
            ns={{ ns: 'test' }}
            actions={{}}
            current={items[0]}
          />
        );
        const node = component.find('[data-testid="mock-saving"]');

        expect(node).to.have.length(1);
      });
    });
  });
});
*/
