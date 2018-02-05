const React from 'react';
const { shallow } from 'enzyme';
const NoAction from 'components/no-action';

describe('<NoAction />', () => {
  describe('#render', () => {
    const component = shallow(<NoAction />);

    it('returns an empty div', () => {
      expect(component.find('div')).to.have.className('editable-element-actions');
    });
  });
});
