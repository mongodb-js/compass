import React from 'react';
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import { getAvailableTools } from '@mongodb-js/compass-generative-ai/provider';
import { AssistantActionsContext } from '../compass-assistant-provider';
import type { Skill } from '../skills-service';
import { SkillsInput, ThinkingIndicator } from './skills-input';

const skills: Skill[] = [
  {
    name: 'mongodb-query',
    description: 'Write queries',
    url: 'https://example.com/query',
    version: '1',
  },
  {
    name: 'mongodb-schema-design',
    description: 'Design schemas',
    url: 'https://example.com/schema',
    version: '1',
  },
];

describe('SkillsInput', function () {
  let onSend: sinon.SinonStub;

  function renderInput({
    fetchSkills = () => Promise.resolve(skills),
    withTools = false,
  }: {
    fetchSkills?: () => Promise<Skill[]>;
    withTools?: boolean;
  } = {}) {
    onSend = sinon.stub();
    return render(
      <AssistantActionsContext.Provider value={{ fetchSkills }}>
        <SkillsInput isStreaming={false} onSend={onSend} onStop={() => {}} />
      </AssistantActionsContext.Provider>,
      {
        preferences: {
          enableGenAIToolCalling: withTools,
          enableGenAIToolCallingAtlasProject: withTools,
        },
      }
    );
  }

  const getEditor = () =>
    screen.getByRole('textbox', { name: 'Ask a question' });

  // The composer is a Lexical editor, which ignores the key and input events
  // user-event produces for contenteditable, so insert text through the editor
  // instance Lexical attaches to its root element.
  function typeText(text: string) {
    const element = getEditor() as HTMLElement & {
      __lexicalEditor: LexicalEditor;
    };
    act(() => {
      // Lexical only mirrors its selection into the DOM while focused
      element.focus();
      element.__lexicalEditor.update(
        () => {
          if (!$isRangeSelection($getSelection())) {
            $getRoot().selectEnd();
          }
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(text);
          }
        },
        { discrete: true }
      );
    });
  }

  async function pickFromMenu(label: string | RegExp) {
    typeText('/');
    userEvent.click(await screen.findByRole('menuitem', { name: label }));
  }

  it('sends plain text unchanged', async function () {
    renderInput();

    typeText('how do I index?');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
    expect(onSend.firstCall.args).to.deep.equal([
      'how do I index?',
      'how do I index?',
    ]);
  });

  it('sends a picked skill as a <skill> tag with its full name', async function () {
    renderInput();

    await pickFromMenu(/^\/query/);
    typeText('find my slow queries');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
    const [text, displayText] = onSend.firstCall.args;
    // The menu shows the short name, but the server needs the full one
    expect(text).to.equal('<skill>mongodb-query</skill> find my slow queries');
    expect(displayText).to.equal('/query find my slow queries');
  });

  it('sends a picked tool as a <tool> tag without the id prefix', async function () {
    const [tool] = getAvailableTools({
      enableAtlasConnectionErrorDebuggerTool: true,
    });
    renderInput({ withTools: true });

    await pickFromMenu(new RegExp(`^/${tool.name}`));
    typeText('what is this?');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
    const [text, displayText] = onSend.firstCall.args;
    expect(text).to.equal(`<tool>${tool.name}</tool> what is this?`);
    expect(text).to.not.include('tool:');
    expect(displayText).to.equal(`/${tool.name} what is this?`);
  });

  it('sends a skill and a tool in the same prompt', async function () {
    const [tool] = getAvailableTools({
      enableAtlasConnectionErrorDebuggerTool: true,
    });
    renderInput({ withTools: true });

    await pickFromMenu(/^\/schema-design/);
    await pickFromMenu(new RegExp(`^/${tool.name}`));
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
    // Via adds a space after each token
    expect(onSend.firstCall.args[0].trim()).to.equal(
      `<skill>mongodb-schema-design</skill> <tool>${tool.name}</tool>`
    );
  });

  it('does not list tools when tool calling is disabled', async function () {
    const [tool] = getAvailableTools({
      enableAtlasConnectionErrorDebuggerTool: true,
    });
    renderInput();

    typeText('/');

    await screen.findByRole('menuitem', { name: /^\/query/ });
    expect(
      screen.queryByRole('menuitem', { name: new RegExp(`^/${tool.name}`) })
    ).to.not.exist;
    expect(screen.getByText('No tools available')).to.exist;
  });

  it('lists skills by short name with their descriptions, and the tools', async function () {
    const [tool] = getAvailableTools({
      enableAtlasConnectionErrorDebuggerTool: true,
    });
    renderInput({ withTools: true });

    typeText('/');

    const skillItem = await screen.findByRole('menuitem', {
      name: /^\/query/,
    });
    expect(skillItem).to.have.text('/queryWrite queries');
    expect(
      screen.getByRole('menuitem', { name: /^\/schema-design/ })
    ).to.have.text('/schema-designDesign schemas');
    expect(screen.getByText('Skills')).to.exist;
    expect(screen.getByText('Tools')).to.exist;
    expect(screen.getByRole('menuitem', { name: new RegExp(`^/${tool.name}`) }))
      .to.exist;
  });

  it('filters the menu by what is typed after the slash', async function () {
    renderInput();

    typeText('/');
    await screen.findByRole('menuitem', { name: /^\/query/ });
    typeText('schema');

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /^\/query/ })).to.not.exist;
    });
    expect(screen.getByRole('menuitem', { name: /^\/schema-design/ })).to.exist;
  });

  it('shows a placeholder when nothing matches the query', async function () {
    renderInput();

    typeText('/');
    await screen.findByRole('menuitem', { name: /^\/query/ });
    typeText('zzz');

    expect(await screen.findByText('No skills found')).to.exist;
    expect(screen.getByText('No tools available')).to.exist;
  });

  it('does not let the section headers be inserted as tokens', async function () {
    renderInput();

    typeText('/');
    userEvent.click(await screen.findByText('Skills'));
    typeText('hello');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
    // The `/` is still plain text: nothing was turned into a token
    expect(onSend.firstCall.args).to.deep.equal(['/hello', '/hello']);
  });

  it('still sends messages when fetching skills fails', async function () {
    renderInput({ fetchSkills: () => Promise.reject(new Error('nope')) });

    typeText('/');
    expect(await screen.findByText('No skills found')).to.exist;

    typeText('hello');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).to.have.been.calledOnce);
  });
});

describe('ThinkingIndicator', function () {
  const steps = ['Calling schema-design skill', 'Calling query skill'];

  it('pins the latest step as the label and lists only the earlier ones while thinking', function () {
    render(<ThinkingIndicator steps={steps} />);

    userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Calling schema-design skill')).to.be.visible;
    expect(screen.getAllByText('Calling query skill')).to.have.lengthOf(1);
  });

  it('has nothing to expand while the only step is the pinned label', function () {
    render(<ThinkingIndicator steps={[steps[0]]} />);

    expect(screen.getByText('Calling schema-design skill')).to.exist;
    expect(screen.queryByRole('button')).to.not.exist;
  });

  it('shows "Thought" with every step once thinking is done', function () {
    render(<ThinkingIndicator steps={steps} isThinking={false} />);

    userEvent.click(screen.getByRole('button', { name: 'Thought' }));

    expect(screen.getByText('Calling schema-design skill')).to.be.visible;
    expect(screen.getByText('Calling query skill')).to.be.visible;
  });

  it('has no expandable content without steps', function () {
    render(<ThinkingIndicator />);

    expect(screen.queryByRole('button')).to.not.exist;
  });
});
