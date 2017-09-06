import React from 'react';
import { shallow } from 'enzyme';
import Code from 'components/code';

describe('Code [Component]', () => {
  const code = '{ name: \'test\'\n}';

  describe('#rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<Code language="js" code={code} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the root node as a <pre /> tag so that it is not parsed by the browser', () => {
      const node = component.find('pre');
      expect(node).to.have.length(1);
    });

    it('renders the code with JavaScript syntax highlighting', () => {
      const node = component.find('.js');
      expect(node).to.have.text(code);
    });
  });
});
