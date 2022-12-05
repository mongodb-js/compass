import sinon from 'sinon';
import React from 'react';
import { mount, shallow } from 'enzyme';
import { Shell } from '@mongosh/browser-repl';
import { ResizeHandle } from '@mongodb-js/compass-components';
import { expect } from 'chai';

import { CompassShell } from './compass-shell';
import ShellHeader from '../shell-header';
import ShellInfoModal from '../shell-info-modal';

function updateAndWaitAsync(wrapper) {
  wrapper.update();
  return new Promise(setImmediate);
}

const fakeRuntime = {
  evaluate: sinon.fake.returns({ printable: 'some result' }),
  setEvaluationListener: () => {},
};

describe('CompassShell', function () {
  before(function () {
    // https://github.com/jsdom/jsdom/issues/1695
    HTMLElement.prototype.scrollIntoView = function () {};
  });

  context('when rendered', function () {
    let wrapper;
    let emitShellOpenedSpy;

    beforeEach(function () {
      emitShellOpenedSpy = sinon.spy();

      wrapper = mount(
        <CompassShell
          runtime={fakeRuntime}
          emitShellPluginOpened={emitShellOpenedSpy}
          enableShell
        />
      );
    });

    afterEach(function () {
      wrapper = null;
    });

    it('has the shell display none', function () {
      const shellDomNode = wrapper
        .find('[data-testid="shell-content"]')
        .getDOMNode();
      const shellDisplayStyle =
        getComputedStyle(shellDomNode).getPropertyValue('display');
      expect(shellDisplayStyle).to.equal('none');
    });

    context('when is it expanded', function () {
      it('calls the function prop emitShellPluginOpened', function () {
        expect(emitShellOpenedSpy.calledOnce).to.equal(false);

        wrapper.setState({ height: 300 });
        wrapper.update();

        expect(emitShellOpenedSpy.calledOnce).to.equal(true);
      });
    });
  });

  context('when rendered expanded', function () {
    context('when runtime property is not present', function () {
      it('does not render a shell if runtime is null', function () {
        const wrapper = mount(<CompassShell runtime={null} />);
        wrapper.setState({ height: 300 });
        wrapper.update();
        expect(wrapper.find(Shell).exists()).to.equal(false);
      });
    });

    context('when runtime property is present', function () {
      let wrapper;

      beforeEach(function () {
        wrapper = mount(
          <CompassShell
            runtime={fakeRuntime}
            emitShellPluginOpened={() => {}}
            enableShell
          />
        );

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();
      });
      afterEach(function () {
        wrapper = null;
      });

      it('renders the Shell', function () {
        expect(wrapper.find(Shell).prop('runtime')).to.equal(fakeRuntime);

        const shellDomNode = wrapper
          .find('[data-testid="shell-content"]')
          .getDOMNode();
        const shellDisplayStyle =
          getComputedStyle(shellDomNode).getPropertyValue('display');
        expect(shellDisplayStyle).to.equal('flex');
      });

      it('renders the ShellHeader component', function () {
        expect(wrapper.find(ShellHeader).exists()).to.equal(true);
      });

      it('renders a Resizable component', function () {
        expect(wrapper.find(ResizeHandle)).to.be.present();
      });

      it('renders the info modal component', function () {
        expect(wrapper.find(ShellInfoModal)).to.be.present();
      });

      it('renders the Shell with an output change handler', function () {
        expect(!!wrapper.find(Shell).prop('onOutputChanged')).to.equal(true);
      });
    });

    context('with a runtime and saved shell output', function () {
      it('renders the inital output', function () {
        const wrapper = mount(
          <CompassShell
            runtime={fakeRuntime}
            emitShellPluginOpened={() => {}}
            shellOutput={[
              {
                type: 'output',
                value: 'pineapple',
              },
            ]}
            enableShell
          />
        );

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();

        expect(wrapper.find(Shell).prop('initialOutput')).to.deep.equal([
          {
            type: 'output',
            value: 'pineapple',
          },
        ]);
      });
    });

    context('when historyStorage is not present', function () {
      it('passes an empty history to the Shell', function () {
        const wrapper = shallow(
          <CompassShell runtime={fakeRuntime} isExpanded enableShell />
        );

        expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal([]);
      });
    });

    context('when it is clicked to collapse', function () {
      let wrapper;

      beforeEach(function () {
        wrapper = mount(
          <CompassShell
            runtime={fakeRuntime}
            emitShellPluginOpened={() => {}}
            enableShell
          />
        );

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();
      });
      afterEach(function () {
        wrapper = null;
      });

      it('sets the collapsed height to 32', function () {
        expect(
          wrapper.find('[data-testid="shell-section"]').prop('style').height
        ).to.equal(32);
      });

      context('when it is expanded again', function () {
        it('resumes its previous height', function () {
          wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
          wrapper.update();

          wrapper.instance().updateHeight(399);
          wrapper.update();

          wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
          wrapper.update();

          wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
          wrapper.update();

          expect(
            wrapper.find('[data-testid="shell-section"]').prop('style').height
          ).to.equal(399);
        });
      });
    });
  });

  context('when historyStorage is present', function () {
    let fakeStorage;

    beforeEach(function () {
      fakeStorage = {
        load: sinon.spy(() => Promise.resolve([])),
        save: sinon.spy(() => Promise.resolve()),
      };
    });

    it('passes the loaded history as initialHistory to Shell', async function () {
      fakeStorage.load = sinon.spy(() => Promise.resolve(['line1']));

      const wrapper = shallow(
        <CompassShell
          runtime={{}}
          historyStorage={fakeStorage}
          isExpanded
          enableShell
        />
      );

      await updateAndWaitAsync(wrapper);

      expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal([
        'line1',
      ]);
    });

    it('saves the history when history changes', async function () {
      const wrapper = shallow(
        <CompassShell
          runtime={{}}
          historyStorage={fakeStorage}
          isExpanded
          enableShell
        />
      );

      await updateAndWaitAsync(wrapper);

      const onHistoryChanged = wrapper.find(Shell).prop('onHistoryChanged');
      onHistoryChanged(['line1']);

      expect(fakeStorage.save.calledWith(['line1'])).to.equal(true);
    });
  });

  it('sets shellOutput on onShellOutputChanged', function () {
    const shell = new CompassShell({ isExpanded: true });

    shell.onShellOutputChanged([
      {
        type: 'output',
        value: 'some output',
      },
    ]);

    expect(shell.shellOutput).to.deep.equal([
      {
        type: 'output',
        value: 'some output',
      },
    ]);
  });

  context('resize actions', function () {
    let onOpenShellSpy;
    let wrapper;

    beforeEach(function () {
      onOpenShellSpy = sinon.spy();
      wrapper = mount(
        <CompassShell
          runtime={fakeRuntime}
          emitShellPluginOpened={onOpenShellSpy}
          enableShell
        />
      );
    });
    afterEach(function () {
      onOpenShellSpy = null;
      wrapper = null;
    });

    context('when expanded', function () {
      beforeEach(function () {
        wrapper.setState({ height: 199 });
        wrapper.update();
      });

      context('when the height is updated', function () {
        beforeEach(function () {
          wrapper.setState({ height: 131 });
          wrapper.update();
        });

        it('does not collapse the component', function () {
          const shellDomNode = wrapper
            .find('[data-testid="shell-content"]')
            .getDOMNode();
          const shellDisplayStyle =
            getComputedStyle(shellDomNode).getPropertyValue('display');
          expect(shellDisplayStyle).to.equal('flex');
        });

        context('when it hits the lower bound', function () {
          beforeEach(function () {
            wrapper.setState({ height: 1 });
            wrapper.update();
          });

          it('collapses the shell', function () {
            expect(
              wrapper.find('[data-testid="shell-section"]').prop('style').height
            ).to.equal(32);
            const shellDomNode = wrapper
              .find('[data-testid="shell-content"]')
              .getDOMNode();
            const shellDisplayStyle =
              getComputedStyle(shellDomNode).getPropertyValue('display');
            expect(shellDisplayStyle).to.equal('none');
          });
        });
      });
    });

    context('when collapsed', function () {
      context('when the height is updated', function () {
        beforeEach(function () {
          wrapper.setState({ height: 55 });
          wrapper.update();
        });

        it('updates the height', function () {
          expect(wrapper.find('[type="range"]').at(0).prop('value')).to.equal(
            55
          );
          expect(
            wrapper.find('[data-testid="shell-section"]').prop('style').height
          ).to.equal(32);
        });

        it('does not expand the component', function () {
          const shellDomNode = wrapper
            .find('[data-testid="shell-content"]')
            .getDOMNode();
          const shellDisplayStyle =
            getComputedStyle(shellDomNode).getPropertyValue('display');
          expect(shellDisplayStyle).to.equal('none');
        });

        it('does not calls the function prop emitShellPluginOpened', function () {
          expect(onOpenShellSpy.called).to.equal(false);
        });

        context('when it hits the resize threshold', function () {
          beforeEach(function () {
            wrapper.setState({ height: 151 });
            wrapper.update();
          });

          it('expands the shell', function () {
            expect(
              wrapper.find('[data-testid="shell-section"]').prop('style').height
            ).to.equal(151);
            const shellDomNode = wrapper
              .find('[data-testid="shell-content"]')
              .getDOMNode();
            const shellDisplayStyle =
              getComputedStyle(shellDomNode).getPropertyValue('display');
            expect(shellDisplayStyle).to.equal('flex');
          });

          it('calls the function prop emitShellPluginOpened', function () {
            expect(onOpenShellSpy.calledOnce).to.equal(true);
          });
        });
      });
    });
  });
});
