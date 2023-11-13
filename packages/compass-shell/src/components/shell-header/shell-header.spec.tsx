import React from 'react';
import { mount, shallow } from 'enzyme';
import { Icon, IconButton, SpinLoader } from '@mongodb-js/compass-components';
import { expect } from 'chai';

import { ShellHeader } from './shell-header';

describe('ShellHeader', function () {
  context('when isExpanded prop is true', function () {
    let wrapper;

    beforeEach(function () {
      wrapper = mount(
        <ShellHeader
          darkMode={undefined}
          isExpanded
          isOperationInProgress={false}
          onShellToggleClicked={() => {}}
          showInfoModal={() => {}}
        />
      );
    });

    afterEach(function () {
      wrapper.unmount();
    });

    it('renders a close chevron button', function () {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).at(1).prop('glyph')).to.equal('ChevronDown');
    });

    it('renders an info button', function () {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).at(0).prop('glyph')).to.equal('InfoWithCircle');
    });

    it('does not render the loader', function () {
      expect(wrapper.find(SpinLoader).exists()).to.equal(false);
    });
  });

  context('when isExpanded prop is false', function () {
    let wrapper;
    beforeEach(function () {
      wrapper = mount(
        <ShellHeader
          darkMode={undefined}
          isExpanded={false}
          isOperationInProgress={false}
          onShellToggleClicked={() => {}}
          showInfoModal={() => {}}
        />
      );
    });

    afterEach(function () {
      wrapper.unmount();
    });

    it('renders an open chevron button', function () {
      expect(wrapper.find(IconButton).exists()).to.equal(true);
      expect(wrapper.find(Icon).prop('glyph')).to.equal('ChevronUp');
    });

    it('does not render the loader', function () {
      expect(wrapper.find(SpinLoader).exists()).to.equal(false);
    });

    it('renders title with guide cue', function () {
      expect(wrapper.text()).to.contain('_MONGOSH');
    });
  });

  context(
    'when isExpanded is false and isOperationInProgress is true',
    function () {
      it('renders the loader', function () {
        const wrapper = mount(
          <ShellHeader
            darkMode={undefined}
            isExpanded={false}
            isOperationInProgress
            onShellToggleClicked={() => {}}
            showInfoModal={() => {}}
          />
        );

        expect(wrapper.find(SpinLoader).exists()).to.equal(true);
        wrapper.unmount();
      });
    }
  );

  context('when rendered', function () {
    it('has a button to toggle the container', function () {
      const wrapper = shallow(
        <ShellHeader
          darkMode={undefined}
          isExpanded={false}
          isOperationInProgress={false}
          onShellToggleClicked={() => {}}
          showInfoModal={() => {}}
        />
      );

      expect(wrapper.find('button').exists()).to.equal(true);
      expect(wrapper.find('[data-testid="shell-expand-button"]')).to.exist;

      wrapper.unmount();
    });
  });
});
