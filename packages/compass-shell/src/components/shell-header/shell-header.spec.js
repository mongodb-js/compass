import React from 'react';
import { mount, shallow } from 'enzyme';
import { Icon } from '@mongodb-js/compass-components';
import { IconButton } from '@mongodb-js/compass-components';

import { ShellLoader } from '@mongosh/browser-repl';

import { ShellHeader } from './shell-header';

describe('ShellHeader', () => {
  context('when isExpanded prop is true', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = mount(<ShellHeader
        isExpanded
        isOperationInProgress={false}
        onShellToggleClicked={() => {}}
        showInfoModal={() => {}}
      />);
    });

    it('renders a close chevron button', () => {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).at(1).prop('glyph')).to.equal('ChevronDown');
    });

    it('renders an info button', () => {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).at(0).prop('glyph')).to.equal('InfoWithCircle');
    });

    it('does not render the loader', () => {
      expect(wrapper.find(ShellLoader).exists()).to.equal(false);
    });
  });

  context('when isExpanded prop is false', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = mount(<ShellHeader
        isExpanded={false}
        isOperationInProgress={false}
        onShellToggleClicked={() => {}}
        showInfoModal={() => {}}
      />);
    });

    it('renders an open chevron button', () => {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).prop('glyph')).to.equal('ChevronUp');
    });

    it('does not render the loader', () => {
      expect(wrapper.find(ShellLoader).exists()).to.equal(false);
    });
  });

  context('when isExpanded is false and isOperationInProgress is true', () => {
    it('renders the loader', () => {
      const wrapper = mount(<ShellHeader
        isExpanded={false}
        isOperationInProgress
        onShellToggleClicked={() => {}}
        showInfoModal={() => {}}
      />);

      expect(wrapper.find(ShellLoader).exists()).to.equal(true);
    });
  });

  context('when rendered', () => {
    it('has a button to toggle the container', async() => {
      const wrapper = shallow(<ShellHeader
        isExpanded={false}
        isOperationInProgress={false}
        onShellToggleClicked={() => {}}
        showInfoModal={() => {}}
      />);

      expect(wrapper.find('button').exists()).to.equal(true);
      expect(wrapper.find('[data-testid="shell-expand-button"]')).to.be.present();
    });
  });
});

