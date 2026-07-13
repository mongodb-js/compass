import React from 'react';
import {
  screen,
  renderWithActiveConnection,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { ObjectId } from 'bson';
import {
  AnalyzeAndRefineResultsButton,
  buildAnalyzeOutputContext,
} from './search-analyze-output-button';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { StagePreviewMetadata } from '../utils/search-score-injection';

const CONNECTION: ConnectionInfo = {
  id: 'test',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

function renderButton(
  props: Partial<
    React.ComponentProps<typeof AnalyzeAndRefineResultsButton>
  > = {}
) {
  return renderWithActiveConnection(
    <AnalyzeAndRefineResultsButton
      onClick={() => {}}
      data-testid="analyze-button"
      {...props}
    />,
    CONNECTION
  );
}

describe('AnalyzeAndRefineResultsButton', function () {
  it('renders the button', async function () {
    await renderButton();
    expect(screen.getByTestId('analyze-button')).to.exist;
    expect(screen.getByText('Analyze & Refine Results')).to.exist;
  });

  it('calls onClick when clicked', async function () {
    const onClick = sinon.stub();
    await renderButton({ onClick });
    userEvent.click(screen.getByTestId('analyze-button'));
    expect(onClick).to.have.been.calledOnce;
  });
});

describe('buildAnalyzeOutputContext', function () {
  const makeMetadata = (
    scores: StagePreviewMetadata['scores']
  ): StagePreviewMetadata => ({ type: '$search', scores });

  it('includes scoreDetails for documents with a matching score entry', function () {
    const docs = [
      new HadronDocument({ _id: 1 }),
      new HadronDocument({ _id: 2 }),
    ];
    const scores = [
      { value: 1.5, description: 'sum of:', details: [] },
      { value: 0.8, description: 'sum of:', details: [] },
    ];

    const { output, documentCount } = buildAnalyzeOutputContext(
      docs,
      makeMetadata(scores)
    );

    expect(documentCount).to.equal(2);
    expect(output).to.include('Document 1:');
    expect(output).to.include(`scoreDetails: ${JSON.stringify(scores[0])}`);
    expect(output).to.include('Document 2:');
    expect(output).to.include(`scoreDetails: ${JSON.stringify(scores[1])}`);
  });

  it('omits the scoreDetails line for documents without a matching score entry', function () {
    const docs = [
      new HadronDocument({ _id: 1 }),
      new HadronDocument({ _id: 2 }),
    ];
    const scores = [{ value: 1.5, description: 'sum of:', details: [] }];

    const { output } = buildAnalyzeOutputContext(docs, makeMetadata(scores));

    expect(output).to.include(`scoreDetails: ${JSON.stringify(scores[0])}`);
    expect(output).to.include('Document 2:');
    expect(output).to.not.include('scoreDetails: undefined');
  });

  it('only analyzes the first topN documents (default 3)', function () {
    const docs = [1, 2, 3, 4, 5].map((id) => new HadronDocument({ _id: id }));
    const scores = docs.map(() => ({
      value: 1,
      description: 'sum of:',
      details: [],
    }));

    const { output, documentCount } = buildAnalyzeOutputContext(
      docs,
      makeMetadata(scores)
    );

    expect(output).to.include('Document 3:');
    expect(output).to.not.include('Document 4:');
    // documentCount reflects the full result set, not just the analyzed subset
    expect(documentCount).to.equal(5);
  });

  it('respects a custom topN', function () {
    const docs = [1, 2, 3].map((id) => new HadronDocument({ _id: id }));
    const scores = docs.map(() => ({
      value: 1,
      description: 'sum of:',
      details: [],
    }));

    const { output } = buildAnalyzeOutputContext(docs, makeMetadata(scores), {
      topN: 1,
    });

    expect(output).to.include('Document 1:');
    expect(output).to.not.include('Document 2:');
  });

  it('preserves BSON types using shell syntax in the output', function () {
    const oid = new ObjectId('000000000000000000000001');
    const docs = [new HadronDocument({ _id: oid, title: 'Espresso Basics' })];
    const scores = [{ value: 1.5, description: 'sum of:', details: [] }];

    const { output } = buildAnalyzeOutputContext(docs, makeMetadata(scores));

    expect(output).to.include("ObjectId('000000000000000000000001')");
    expect(output).to.include('Espresso Basics');
  });
});
