import React from 'react';
import { shallow, mount } from 'enzyme';
import { listFactory } from 'components/list';
import styles from './list.less';

const ListComponent = listFactory(
  () => (<span data-test-id="mock-item" />),
  () => (<div data-test-id="mock-saving" />)
);

describe('listFactory [Component]', () => {
  const items = [
    { _ns: 'test', _name: 'foo' },
    { _ns: 'test', _name: 'bar' },
    { _ns: 'test', _name: 'bazz' }
  ];

  describe('#rendering', () => {
    it('renders the root node with the correct className', () => {
      const component = shallow(<ListComponent items={items} ns={{ns: 'test'}} actions={{}} />);
      const node = component.find(`.${styles.component}`);

      expect(node).to.have.length(1);
    });

    it('renders the list with the correct className', () => {
      const component = shallow(<ListComponent items={items} ns={{ns: 'test'}} actions={{}} />);
      const node = component.find(`.${styles.items}`);

      expect(node).to.have.length(1);
    });

    describe('when there are no items to render', () => {
      it('the list is not rendered with any children', () => {
        const component = shallow(<ListComponent items={[]} ns={{ns: 'test'}} actions={{}} />);
        const node = component.find(`.${styles.items}`);

        expect(node.children()).to.have.length(0);
      });

      it('renders a zero state title', () => {
        const component = shallow(<ListComponent items={[]} ns={{ns: 'test'}} actions={{}} zeroStateTitle="Foo" />);
        const node = component.find(`.${styles['zeroState-title']}`);

        expect(node.text()).to.have.equal('Foo');
      });
    });

    describe('when there are items to render', () => {
      it('the list is rendered with the correct number of children', () => {
        const component = shallow(<ListComponent items={items} ns={{ns: 'test'}} actions={{}} />);
        const node = component.find(`.${styles.items}`);

        expect(node.children()).to.have.length(3);
      });

      it('does not render a zero state title', () => {
        const component = shallow(<ListComponent items={items} ns={{ns: 'test'}} actions={{}} zeroStateTitle="Foo" />);
        const node = component.find(`.${styles['zeroState-title']}`);

        expect(node).to.have.length(0);
      });
    });

    describe('when we have a current model', () => {
      it('renders a saving component', () => {
        const component = mount(<ListComponent items={items} ns={{ns: 'test'}} actions={{}} current={items[0]} />);
        const node = component.find('[data-test-id="mock-saving"]');

        expect(node).to.have.length(1);
      });
    });
  });
});
