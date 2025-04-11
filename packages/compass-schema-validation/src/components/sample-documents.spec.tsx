import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { SampleDocuments } from './sample-documents';
import { Provider } from 'react-redux';
import { configureStore } from '../stores/store';
import { INITIAL_STATE } from '../modules';

describe('SampleDocuments [Component]', function () {
  it('initial state : renders the CTA', function () {
    const store = configureStore({}, {} as any);
    render(
      <Provider store={store}>
        <SampleDocuments />
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Preview documents' })).to.be
      .visible;
  });

  it('non initial state : renders a valid and invalid document preview', function () {
    const store = configureStore(
      {
        ...INITIAL_STATE,
        sampleDocuments: {
          validDocumentState: 'loading',
          invalidDocumentState: 'loading',
          validDocument: undefined,
          invalidDocument: undefined,
        },
      },
      {} as any
    );
    render(
      <Provider store={store}>
        <SampleDocuments />
      </Provider>
    );

    expect(screen.queryByRole('button', { name: 'Preview documents' })).not.to
      .exist;
    expect(screen.getByTestId('matching-documents')).to.be.visible;
    expect(screen.getByTestId('notmatching-documents')).to.be.visible;
  });
});
