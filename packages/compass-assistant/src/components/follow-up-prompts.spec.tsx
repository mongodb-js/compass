import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { FollowUpPrompts, parseFollowUpQuestions } from './follow-up-prompts';
import { expect } from 'chai';
import sinon from 'sinon';

describe('parseFollowUpQuestions', function () {
  const complete = { isLastMessage: true, isResponseComplete: true };
  const midStream = { isLastMessage: true, isResponseComplete: false };
  const olderMessage = { isLastMessage: false, isResponseComplete: true };

  it('returns empty questions and unchanged text when section is absent', function () {
    const text = '## Summary\nThis is a response.';
    const result = parseFollowUpQuestions(text, complete);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal(text);
  });

  it('extracts numbered questions and strips the section', function () {
    const text = `## Summary
Some analysis here.

### Follow-Up Questions
1. Can you explain how the final score was calculated?
2. Why are one-bedroom listings showing up?
3. Which fields contributed the most to this document's score?`;

    const result = parseFollowUpQuestions(text, complete);
    expect(result.questions).to.deep.equal([
      'Can you explain how the final score was calculated?',
      'Why are one-bedroom listings showing up?',
      "Which fields contributed the most to this document's score?",
    ]);
    expect(result.strippedText).to.equal('## Summary\nSome analysis here.');
  });

  it('strips the section mid-stream but returns no questions', function () {
    const text = `## Summary\nSome analysis.\n### Follow-Up Questions\n`;
    const result = parseFollowUpQuestions(text, midStream);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal('## Summary\nSome analysis.');
  });

  it('strips the section mid-stream even with partial numbered lines', function () {
    const text = `## Summary\nSome analysis.\n### Follow-Up Questions\n1. First question?`;
    const result = parseFollowUpQuestions(text, midStream);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal('## Summary\nSome analysis.');
  });

  it('strips the section for older messages but returns no questions', function () {
    const text = `## Summary\nSome analysis.\n### Follow-Up Questions\n1. Question one?`;
    const result = parseFollowUpQuestions(text, olderMessage);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal('## Summary\nSome analysis.');
  });

  it('does not match wrong casing or hash count', function () {
    const text = `Response text.\n### follow-up questions\n1. Question one?`;
    const result = parseFollowUpQuestions(text, complete);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal(text);
  });

  it('returns empty questions when section exists but has no content', function () {
    const text = 'Response.\n### Follow-Up Questions\n';
    const result = parseFollowUpQuestions(text, complete);
    expect(result.questions).to.deep.equal([]);
    expect(result.strippedText).to.equal(text);
  });
});

describe('FollowUpPrompts', function () {
  let onSendStub: sinon.SinonStub;

  beforeEach(function () {
    onSendStub = sinon.stub();
  });

  it('renders nothing when questions array is empty', function () {
    render(<FollowUpPrompts questions={[]} onSend={onSendStub} />);
    expect(screen.queryByText('Suggested Prompts')).to.not.exist;
  });

  it('renders the label and chips for each question', function () {
    render(
      <FollowUpPrompts
        questions={['Question one?', 'Question two?']}
        onSend={onSendStub}
      />
    );
    expect(screen.getByText('Suggested Prompts')).to.exist;
    expect(screen.getByTestId('follow-up-prompt-0')).to.exist;
    expect(screen.getByTestId('follow-up-prompt-1')).to.exist;
    expect(screen.getByText('Question one?')).to.exist;
    expect(screen.getByText('Question two?')).to.exist;
  });

  it('calls onSend with the question text when a chip is clicked', async function () {
    render(
      <FollowUpPrompts
        questions={['Question one?', 'Question two?']}
        onSend={onSendStub}
      />
    );

    userEvent.click(screen.getByTestId('follow-up-prompt-0'));

    await waitFor(() => {
      expect(onSendStub.calledOnce).to.be.true;
      expect(onSendStub.firstCall.args[0]).to.equal('Question one?');
    });
  });
});
