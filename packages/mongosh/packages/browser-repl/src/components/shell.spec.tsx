import React from 'react';
import sinon from 'sinon';
import { expect } from '../../testing/chai';
import { mount, ReactWrapper, shallow, ShallowWrapper } from '../../testing/enzyme';
import { PasswordPrompt } from './password-prompt';
import { Shell } from './shell';
import { ShellInput } from './shell-input';
import { ShellOutput } from './shell-output';
import { ShellOutputEntry } from './shell-output-line';

const styles = require('./shell.less');

const wait: (ms?: number) => Promise<void> = (ms = 10) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

describe('<Shell />', () => {
  let onOutputChangedSpy;
  let onHistoryChangedSpy;
  let onOperationStartedSpy;
  let onOperationEndSpy;
  let fakeRuntime;
  let wrapper: ShallowWrapper | ReactWrapper;
  let scrollIntoView;
  let elementFocus;
  let onInput;

  beforeEach(() => {
    onInput = async(code: string): Promise<void> => {
      wrapper.find(ShellInput).prop('onInput')(code);
      await wait();
      wrapper.update();
    };

    scrollIntoView = sinon.spy(Element.prototype, 'scrollIntoView');
    elementFocus = sinon.spy(HTMLElement.prototype, 'focus');

    fakeRuntime = {
      evaluate: sinon.fake.returns({ printable: 'some result' }),
      setEvaluationListener: () => {}
    };

    onOutputChangedSpy = sinon.spy();
    onHistoryChangedSpy = sinon.spy();
    onOperationStartedSpy = sinon.spy();
    onOperationEndSpy = sinon.spy();

    wrapper = shallow(<Shell
      runtime={fakeRuntime}
      onOutputChanged={onOutputChangedSpy}
      onHistoryChanged={onHistoryChangedSpy}
      onOperationStarted={onOperationStartedSpy}
      onOperationEnd={onOperationEndSpy}
    />);
  });

  afterEach(() => {
    scrollIntoView.restore();
    elementFocus.restore();
  });

  it('renders a ShellOutput component', () => {
    expect(wrapper.find(ShellOutput)).to.have.lengthOf(1);
  });

  it('passes the initial output to ShellOutput', () => {
    expect(wrapper.find(ShellOutput).prop('output')).to.deep.equal([]);
  });

  it('renders a ShellInput component', () => {
    expect(wrapper.find(ShellInput)).to.have.lengthOf(1);
  });

  it('passes runtime as autocompleter to ShellInput', () => {
    expect(wrapper.find(ShellInput).prop('autocompleter')).to.equal(fakeRuntime);
  });

  it('does not set the editor as readOnly by default', () => {
    expect(wrapper.find(ShellInput).prop('operationInProgress')).to.equal(false);
  });

  context('when initialOutput is set', () => {
    it('allows to set intial output', async() => {
      const initialOutput: ShellOutputEntry[] = [
        { format: 'input', value: 'line 1' },
        { format: 'output', value: 'some result' }
      ];

      wrapper = shallow(<Shell
        runtime={fakeRuntime}
        initialOutput={initialOutput}
      />);

      wrapper.update();

      await wait();

      expect(wrapper.state('output')).to.deep.equal(initialOutput);
    });

    it('applies max maxOutputLength', () => {
      const initialOutput: ShellOutputEntry[] = [
        { format: 'input', value: 'line 1' },
        { format: 'output', value: 'some result' },
        { format: 'input', value: 'line 2' },
        { format: 'output', value: 'some result' }
      ];

      wrapper = shallow(<Shell
        runtime={fakeRuntime}
        maxOutputLength={3}
        initialOutput={initialOutput}
      />);

      expect(wrapper.state('output')).to.deep.equal([
        { format: 'output', value: 'some result' },
        { format: 'input', value: 'line 2' },
        { format: 'output', value: 'some result' }
      ]);
    });
  });

  context('when initialHistory is set', () => {
    it('allows to set intial history', () => {
      const history: string[] = [
        'line 1'
      ];

      wrapper = shallow(<Shell
        runtime={fakeRuntime}
        initialHistory={history}
      />);

      expect(wrapper.state('history')).to.deep.equal(history);
    });

    it('applies max maxHistoryLength', () => {
      const initialHistory: string[] = ['line3', 'line2', 'line1'];

      wrapper = shallow(<Shell
        runtime={fakeRuntime}
        maxHistoryLength={2}
        initialHistory={initialHistory}
      />);

      expect(wrapper.state('history')).to.deep.equal(['line3', 'line2']);
    });
  });

  context('when an input is entered', () => {
    beforeEach(async() => {
      await onInput('some code');
    });

    it('evaluates the input with runtime', () => {
      expect(fakeRuntime.evaluate).to.have.been.calledWith('some code');
    });

    it('adds the evaluated input and output as lines to the output', () => {
      expect(wrapper.find(ShellOutput).prop('output')).to.deep.equal([
        { format: 'input', value: 'some code' },
        { format: 'output', value: 'some result', type: undefined }
      ]);
    });

    it('calls onOutputChanged with output', () => {
      expect(onOutputChangedSpy).to.have.been.calledWith([
        { format: 'input', value: 'some code' },
        { format: 'output', value: 'some result', type: undefined }
      ]);
    });

    it('applies maxOutputLength', async() => {
      wrapper = shallow(<Shell runtime={fakeRuntime} maxOutputLength={3} />);
      await onInput('line 1');
      await onInput('line 2');
      expect(wrapper.state('output')).to.deep.equal([
        { format: 'output', value: 'some result', type: undefined },
        { format: 'input', value: 'line 2' },
        { format: 'output', value: 'some result', type: undefined }
      ]);
    });

    it('updates the history', async() => {
      expect(wrapper.find(ShellInput).prop('history')).to.deep.equal([
        'some code'
      ]);

      await onInput('some more code');

      const expected = [
        'some more code',
        'some code'
      ];

      expect(wrapper.find(ShellInput).prop('history')).to.deep.equal(expected);
    });

    it('calls onHistoryChanged', () => {
      expect(onHistoryChangedSpy).to.have.been.calledOnceWith(['some code']);
    });

    it('applies maxHistoryLength', async() => {
      wrapper = shallow(<Shell runtime={fakeRuntime} maxHistoryLength={2} />);
      await onInput('line 1');

      await onInput('line 2');
      expect(wrapper.state('history')).to.deep.equal(['line 2', 'line 1']);

      await onInput('line 3');
      expect(wrapper.state('history')).to.deep.equal(['line 3', 'line 2']);
    });

    it('redacts history if redactInfo is set', async() => {
      wrapper = shallow(<Shell runtime={fakeRuntime} redactInfo />);
      await onInput('some@email.com');
      expect(wrapper.state('history')).to.deep.equal(['<email>']);
    });

    it('does not add sensitive commands to the history', async() => {
      wrapper = shallow(<Shell runtime={fakeRuntime} />);
      await onInput('db.createUser()');
      expect(wrapper.state('history')).to.deep.equal([]);
    });

    it('calls onOperationStarted', async() => {
      expect(onOperationStartedSpy).to.have.been.calledOnce;
    });

    it('calls onOperationEnd', async() => {
      expect(onOperationEndSpy).to.have.been.calledOnce;
    });
  });

  context('when empty input is entered', () => {
    beforeEach(async() => {
      await onInput('');
    });

    it('does not evaluate the input with runtime', () => {
      expect(fakeRuntime.evaluate).not.to.have.been.calledWith('');
    });

    it('adds a blank line to the output', () => {
      expect(wrapper.find(ShellOutput).prop('output')).to.deep.equal([
        { format: 'input', value: ' ' },
      ]);
    });

    it('does not update the history', async() => {
      expect(wrapper.find(ShellInput).prop('history')).to.deep.equal([]);
    });
  });


  it('sets the editor as readOnly/operationInProgress true while onInput is executed', async() => {
    let onInputDone;
    wrapper = shallow(<Shell
      runtime={{
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        evaluate: (code: string): Promise<any> => {
          return new Promise(resolve => {
            onInputDone = resolve;
          });
        },
        setEvaluationListener: () => {}
      } as any}
    />);

    const onInputStub = wrapper.find(ShellInput).prop('onInput');
    onInputStub('ok');

    // Check operationInProgress is true while eval is called
    expect(wrapper.find(ShellInput).prop('operationInProgress')).to.equal(true);

    // Fufill eval.
    onInputDone();
    await wait();

    wrapper.update();

    // Ensure operationInProgress is false.
    expect(wrapper.find(ShellInput).prop('operationInProgress')).to.equal(false);
  });

  context('when an input is entered and it causes an error', () => {
    let error;

    beforeEach(async() => {
      error = new Error('some error');
      fakeRuntime.evaluate = sinon.fake.returns(Promise.reject(error));

      await onInput('some code');
    });

    it('adds the evaluated input and an error to the output if the evaluation fails', async() => {
      const output = wrapper.find(ShellOutput).prop('output');

      expect(output).to.deep.equal([
        { format: 'input', value: 'some code' },
        { format: 'error', value: error }
      ]);
    });

    it('sets the editor as operationInProgress false after the execution', async() => {
      expect(wrapper.find(ShellInput).prop('operationInProgress')).to.equal(false);
    });

    it('calls onOutputChanged with output', () => {
      expect(onOutputChangedSpy).to.have.been.calledWith([
        { format: 'input', value: 'some code' },
        { format: 'error', value: error }
      ]);
    });

    it('updates the history', async() => {
      expect(wrapper.find(ShellInput).prop('history')).to.deep.equal([
        'some code'
      ]);

      await onInput('some more code');

      const expected = [
        'some more code',
        'some code'
      ];

      expect(wrapper.find(ShellInput).prop('history')).to.deep.equal(expected);
    });

    it('calls onHistoryChanged', () => {
      expect(onHistoryChangedSpy).to.have.been.calledOnceWith(['some code']);
    });

    it('calls onOperationEnd', async() => {
      expect(onOperationEndSpy).to.have.been.calledOnce;
    });
  });

  it('scrolls the container to the bottom each time the output is updated', () => {
    wrapper = mount(<Shell runtime={fakeRuntime} />);

    wrapper.setState({ output: [
      { format: 'input', value: 'some code' },
      { format: 'output', value: 'some result' }
    ] });

    wrapper.update();

    expect(Element.prototype.scrollIntoView).to.have.been.calledThrice;
  });

  it('focuses on the input when the background container is clicked', () => {
    wrapper = mount(<Shell runtime={fakeRuntime} />);
    const container = wrapper.find(`.${styles.shell}`);

    const fakeMouseEvent: any = {
      target: 'a',
      currentTarget: 'a'
    };
    container.prop('onClick')(fakeMouseEvent);

    expect(HTMLElement.prototype.focus).to.have.been.calledOnce;
  });

  it('does not focus on the input when an element that is not the background container is clicked', () => {
    wrapper = mount(<Shell runtime={fakeRuntime} />);
    const container = wrapper.find(`.${styles.shell}`);

    const fakeMouseEvent: any = {
      target: 'a',
      currentTarget: 'b'
    };
    container.prop('onClick')(fakeMouseEvent);

    expect(HTMLElement.prototype.focus).to.not.have.been.called;
  });

  it('updated the output when .onPrint is called', () => {
    wrapper.instance().onPrint([{ type: null, printable: 42 }]);

    expect(onOutputChangedSpy).to.have.been.calledWith([
      { format: 'output', value: 42, type: null }
    ]);
  });

  it('clears the current output when cls is used', () => {
    wrapper.setState({ output: [
      { format: 'input', value: 'some code' },
      { format: 'output', value: 'some result' }
    ] });

    wrapper.instance().onClearCommand();

    expect(onOutputChangedSpy).to.have.been.calledWith([]);
  });
  describe('password prompt', () => {
    let pressKey: (key: string) => Promise<void>;
    beforeEach(() => {
      wrapper = mount(<Shell runtime={fakeRuntime} />);
      pressKey = async(key: string) => {
        wrapper.find(PasswordPrompt).instance().onKeyDown({
          key,
          target: wrapper.find('input').instance()
        });
        await wait();
        wrapper.update();
      };
    });

    it('displays a password prompt when asked to', async() => {
      expect(wrapper.find(PasswordPrompt)).to.have.lengthOf(0);

      const passwordPromise = wrapper.instance().onPrompt('Enter password', 'password');
      await wait();
      wrapper.update();
      expect(wrapper.state('passwordPrompt')).to.equal('Enter password');
      expect(wrapper.find(PasswordPrompt)).to.have.lengthOf(1);
      wrapper.find('input').instance().value = '12345';
      await pressKey('Enter');

      expect(await passwordPromise).to.equal('12345');
      expect(HTMLElement.prototype.focus).to.have.been.called;
    });

    it('can abort reading the password', async() => {
      const passwordPromise = wrapper.instance().onPrompt('Enter password', 'password');
      await wait();
      wrapper.update();
      await pressKey('Esc');

      try {
        await passwordPromise;
      } catch {
        expect(HTMLElement.prototype.focus).to.have.been.called;
        return;
      }
      expect.fail('should have been rejected');
    });
  });

  context('shows a shell prompt', () => {
    it('defaults to >', async() => {
      wrapper = mount(<Shell runtime={fakeRuntime} />);
      await wait();
      expect(wrapper.find('ShellInput').prop('prompt')).to.equal('>');
    });

    it('initializes with the value of getShellPrompt', async() => {
      fakeRuntime.getShellPrompt = async() => {
        return 'mongos>';
      };
      wrapper = mount(<Shell runtime={fakeRuntime} />);
      await wait();
      wrapper.update();
      expect(wrapper.find('ShellInput').prop('prompt')).to.equal('mongos>');
    });

    it('updates after evaluation', async() => {
      let called = false;
      fakeRuntime.getShellPrompt = async() => {
        if (!called) {
          called = true;
          return 'mongos>';
        }
        return 'rs0:primary>';
      };

      wrapper = mount(<Shell runtime={fakeRuntime} />);
      await wait();
      wrapper.update();
      expect(wrapper.find('ShellInput').prop('prompt')).to.equal('mongos>');

      await onInput('some code');
      expect(wrapper.find('ShellInput').prop('prompt')).to.equal('rs0:primary>');
    });
  });
});
