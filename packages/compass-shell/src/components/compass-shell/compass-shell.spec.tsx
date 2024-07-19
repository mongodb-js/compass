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
} as any;

describe('CompassShell', function () {
  context('when rendered', function () {
    let wrapper;

    beforeEach(function () {
      wrapper = mount(
        <CompassShell
          initialHistory={[]}
          onHistoryChange={() => undefined}
          runtime={fakeRuntime}
          enableShell
        />
      );
    });

    afterEach(function () {
      wrapper.unmount();
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
  });

  context('when rendered expanded', function () {
    context('when runtime property is not present', function () {
      it('does not render a shell if runtime is null', function () {
        const wrapper = mount(
          <CompassShell
            initialHistory={[]}
            onHistoryChange={() => undefined}
            runtime={null}
            enableShell
          />
        );
        try {
          wrapper.setState({ height: 300 });
          wrapper.update();
          expect(wrapper.find(Shell).exists()).to.equal(false);
        } finally {
          wrapper?.unmount();
        }
      });
    });

    context('when runtime property is present', function () {
      let wrapper;

      beforeEach(function () {
        wrapper = mount(
          <CompassShell
            initialHistory={[]}
            onHistoryChange={() => undefined}
            runtime={fakeRuntime}
            enableShell
          />
        );

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();
      });
      afterEach(function () {
        wrapper.unmount();
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
        expect(wrapper.find(ResizeHandle)).to.exist;
      });

      it('renders the info modal component', function () {
        expect(wrapper.find(ShellInfoModal)).to.exist;
      });

      it('renders the Shell with an output change handler', function () {
        expect(!!wrapper.find(Shell).prop('onOutputChanged')).to.equal(true);
      });
    });

    context('with a runtime and saved shell output', function () {
      it('renders the inital output', function () {
        const wrapper = mount(
          <CompassShell
            initialHistory={[]}
            onHistoryChange={() => undefined}
            runtime={fakeRuntime}
            shellOutput={[
              {
                type: 'output',
                value: 'pineapple',
                format: 'output',
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
            format: 'output',
          },
        ]);

        wrapper.unmount();
      });
    });

    context('when historyStorage is not present', function () {
      it('passes an empty history to the Shell', function () {
        const wrapper = shallow(
          <CompassShell
            initialHistory={[]}
            onHistoryChange={() => undefined}
            runtime={fakeRuntime}
            enableShell
          />
        );

        expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal([]);

        wrapper.unmount();
      });
    });

    context('when it is clicked to collapse', function () {
      let wrapper;

      beforeEach(function () {
        wrapper = mount(
          <CompassShell
            initialHistory={[]}
            onHistoryChange={() => undefined}
            runtime={fakeRuntime}
            enableShell
          />
        );

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();

        wrapper.find('[data-testid="shell-expand-button"]').simulate('click');
        wrapper.update();
      });

      afterEach(function () {
        wrapper.unmount();
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
    const history = ['line1'];

    it('passes the loaded history as initialHistory to Shell', async function () {
      const wrapper = shallow(
        <CompassShell
          runtime={{} as any}
          initialHistory={history}
          onHistoryChange={() => undefined}
          enableShell
        />
      );

      await updateAndWaitAsync(wrapper);

      expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal([
        'line1',
      ]);

      wrapper.unmount();
    });

    it('saves the history when history changes', async function () {
      const changeSpy = sinon.spy();

      const wrapper = shallow(
        <CompassShell
          runtime={{} as any}
          initialHistory={[]}
          onHistoryChange={changeSpy}
          enableShell
        />
      );

      await updateAndWaitAsync(wrapper);

      const onHistoryChanged = wrapper.find(Shell).prop('onHistoryChanged');
      onHistoryChanged(['line1']);

      expect(changeSpy).to.have.been.calledOnceWith(['line1']);

      wrapper.unmount();
    });
  });

  it('sets shellOutput on onShellOutputChanged', function () {
    const shell = new CompassShell({} as any);

    shell.onShellOutputChanged([
      {
        type: 'output',
        value: 'some output',
        format: 'output',
      },
    ]);

    expect(shell.shellOutput).to.deep.equal([
      {
        type: 'output',
        value: 'some output',
        format: 'output',
      },
    ]);
  });

  context('resize actions', function () {
    let wrapper;

    beforeEach(function () {
      wrapper = mount(
        <CompassShell
          initialHistory={[]}
          onHistoryChange={() => undefined}
          runtime={fakeRuntime}
          enableShell
        />
      );
    });
    afterEach(function () {
      wrapper.unmount();
      wrapper = null;
    });

    context('when expanded', function () {
      beforeEach(function () {
        wrapper.setState({ height: 199 });
        wrapper.update();

        // make sure it starts off as we expect
        const shellDomNode = wrapper
          .find('[data-testid="shell-content"]')
          .getDOMNode();
        const shellDisplayStyle =
          getComputedStyle(shellDomNode).getPropertyValue('display');
        expect(shellDisplayStyle, 'before').to.equal('flex');
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
          expect(shellDisplayStyle, 'after').to.equal('flex');
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
            expect(wrapper.state('height')).to.equal(1);
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

        context('when it hits the resize threshold', function () {
          beforeEach(function () {
            wrapper.setState({ height: 151 });
            wrapper.update();
          });

          it('expands the shell', function () {
            expect(
              wrapper.find('[data-testid="shell-section"]').prop('style').height
            ).to.equal(151);
            expect(wrapper.state('height')).to.equal(151);
          });
        });
      });
    });
  });
});
