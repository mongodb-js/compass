import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import { Shell } from '@mongosh/browser-repl';
import { ResizeHandleHorizontal } from '@mongodb-js/compass-components';

import { CompassShell } from './compass-shell';
import ShellHeader from '../shell-header';
import InfoModal from '../info-modal';
import styles from './compass-shell.module.less';

function updateAndWaitAsync(wrapper) {
  wrapper.update();
  return new Promise(setImmediate);
}

describe('CompassShell', () => {
  context('when the prop isExpanded is false', () => {
    it('has the shell display none', () => {
      const fakeRuntime = {};
      const wrapper = shallow(<CompassShell
        runtime={fakeRuntime}
        isExpanded={false}
      />);
      expect(wrapper.find(`.${styles['compass-shell-shell-container-visible']}`).exists()).to.equal(false);
    });

    context('when is it expanded', () => {
      it('calls the function prop emitShellPluginOpened', () => {
        let calledFunc = false;
        const mockOnOpenShellPlugin = () => {
          calledFunc = true;
        };

        const shell = new CompassShell({
          isExpanded: false,
          emitShellPluginOpened: mockOnOpenShellPlugin
        });
        shell.shellToggleClicked();

        expect(calledFunc).to.equal(true);
      });
    });
  });

  context('when the prop isExpanded is true', () => {
    context('when runtime property is not present', () => {
      it('does not render a shell if runtime is null', () => {
        const wrapper = shallow(<CompassShell runtime={null} isExpanded />);
        expect(wrapper.find(Shell).exists()).to.equal(false);
      });
    });

    context('when runtime property is present', () => {
      it('renders the Shell', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);
        expect(wrapper.find(Shell).prop('runtime')).to.equal(fakeRuntime);
        expect(wrapper.find(`.${styles['compass-shell-shell-container-visible']}`).exists()).to.equal(true);
      });

      it('renders the ShellHeader component', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);
        expect(wrapper.find(ShellHeader).exists()).to.equal(true);
      });

      it('renders a Resizable component', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);
        expect(wrapper.find(ResizeHandleHorizontal)).to.be.present();
      });

      it('renders the info modal component', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);
        expect(wrapper.find(InfoModal)).to.be.present();
      });

      it('renders the Shell with an output change handler', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);
        expect(!!wrapper.find(Shell).prop('onOutputChanged')).to.equal(true);
      });

      it('passes saved shell output', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell
          runtime={fakeRuntime}
          isExpanded
          shellOutput={[{
            type: 'output',
            value: 'pineapple'
          }]}
        />);

        expect(wrapper.find(Shell).prop('initialOutput')).to.deep.equal([{
          type: 'output',
          value: 'pineapple'
        }]);
      });
    });

    context('when historyStorage is not present', () => {
      it('passes an empty history to the Shell', () => {
        const fakeRuntime = {};
        const wrapper = shallow(<CompassShell runtime={fakeRuntime} isExpanded />);

        expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal([]);
      });
    });

    context('when it is clicked to collapse', () => {
      let shell;

      beforeEach(() => {
        shell = new CompassShell({
          isExpanded: true,
          emitShellPluginOpened: () => {}
        });
        shell.setState = stateUpdate => {
          shell.state = {
            ...shell.state,
            ...stateUpdate
          };
        };
        shell.shellToggleClicked();
      });
      afterEach(() => {
        shell = null;
      });

      it('sets the collapsed height to 32', () => {
        expect(shell.state.height).to.equal(32);
      });

      it('sets the state to collapsed', () => {
        expect(shell.state.isExpanded).to.equal(false);
      });

      context('when it is expanded again', () => {
        it('resumes its previous height', () => {
          shell.shellToggleClicked();
          shell.onResize(199);
          shell.shellToggleClicked();
          shell.shellToggleClicked();

          expect(shell.state.height).to.equal(199);
        });
      });
    });
  });

  context('when historyStorage is present', () => {
    let fakeStorage;
    let fakeRuntime;

    beforeEach(() => {
      fakeStorage = {
        load: sinon.spy(() => Promise.resolve([])),
        save: sinon.spy(() => Promise.resolve()),
      };

      fakeRuntime = {};
    });

    it('passes the loaded history as initialHistory to Shell', async() => {
      fakeStorage.load = sinon.spy(() => Promise.resolve(['line1']));

      const wrapper = shallow(<CompassShell
        runtime={fakeRuntime}
        historyStorage={fakeStorage}
        isExpanded
      />);

      await updateAndWaitAsync(wrapper);

      expect(wrapper.find(Shell).prop('initialHistory')).to.deep.equal(['line1']);
    });

    it('saves the history when history changes', async() => {
      const wrapper = shallow(<CompassShell
        runtime={fakeRuntime}
        historyStorage={fakeStorage}
        isExpanded
      />);

      await updateAndWaitAsync(wrapper);

      const onHistoryChanged = wrapper.find(Shell).prop('onHistoryChanged');
      onHistoryChanged(['line1']);

      expect(
        fakeStorage.save.calledWith(['line1'])
      ).to.equal(true);
    });
  });

  it('sets shellOutput on onShellOutputChanged', () => {
    const shell = new CompassShell({ isExpanded: true });

    shell.onShellOutputChanged([{
      type: 'output',
      value: 'some output'
    }]);

    expect(shell.shellOutput).to.deep.equal([{
      type: 'output',
      value: 'some output'
    }]);
  });

  context('resize actions', () => {
    let shellComponent;

    context('when expanded', () => {
      beforeEach(() => {
        shellComponent = new CompassShell({
          isExpanded: true
        });
        shellComponent.setState = stateUpdate => {
          shellComponent.state = {
            ...shellComponent.state,
            ...stateUpdate
          };
        };

        shellComponent.state.height = 111;
      });

      context('when the resize is called', () => {
        beforeEach(() => {
          shellComponent.onResize(131);
        });

        it('updates the height', () => {
          expect(shellComponent.state.height).to.equal(131);
        });

        it('does not collapse the component', () => {
          expect(shellComponent.state.isExpanded).to.equal(true);
        });

        context('when it hits the lower bound', () => {
          beforeEach(() => {
            shellComponent.onResize(1);
          });

          it('collapses the shell', () => {
            expect(shellComponent.state.height).to.equal(1);
            expect(shellComponent.state.isExpanded).to.equal(false);
          });
        });
      });
    });

    context('when collapsed', () => {
      let mockOnOpenShellPlugin;
      let calledFunc;

      beforeEach(() => {
        calledFunc = false;
        mockOnOpenShellPlugin = () => {
          calledFunc = true;
        };
        shellComponent = new CompassShell({
          isExpanded: false,
          emitShellPluginOpened: mockOnOpenShellPlugin
        });
        shellComponent.setState = stateUpdate => {
          shellComponent.state = {
            ...shellComponent.state,
            ...stateUpdate
          };
        };

        shellComponent.state.height = 32;
      });

      context('when the resize is called', () => {
        beforeEach(() => {
          shellComponent.onResize(55);
        });

        it('updates the height', () => {
          expect(shellComponent.state.height).to.equal(55);
        });

        it('does not expand the component', () => {
          expect(shellComponent.state.isExpanded).to.equal(false);
        });

        it('does not calls the function prop emitShellPluginOpened', () => {
          expect(calledFunc).to.equal(false);
        });

        context('when it hits the resize threshold', () => {
          beforeEach(() => {
            shellComponent.onResize(151);
          });

          it('expands the shell', () => {
            expect(shellComponent.state.height).to.equal(151);
            expect(shellComponent.state.isExpanded).to.equal(true);
          });

          it('calls the function prop emitShellPluginOpened', () => {
            expect(calledFunc).to.equal(true);
          });
        });
      });
    });
  });
});

