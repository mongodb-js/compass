import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { CreateIndexForm } from './create-index-form';
import type { Field } from '../../modules/create-index';
import { expect } from 'chai';
import { setupStore } from '../../../test/setup-store';

describe('CreateIndexForm', () => {
  const defaultProps = {
    namespace: 'test.collection',
    fields: [
      { name: 'field1', type: '1' },
      { name: 'field2', type: '-1' },
    ] as Field[],
    serverVersion: '5.0.0',
    onSelectFieldNameClick: () => {},
    onSelectFieldTypeClick: () => {},
    onAddFieldClick: () => {},
    onRemoveFieldClick: () => {},
    query: null,
  };

  const renderWithStore = (props = defaultProps) => {
    const store = setupStore();
    return render(
      <Provider store={store}>
        <CreateIndexForm {...props} />
      </Provider>
    );
  };

  it('renders the create index form', () => {
    renderWithStore();
    expect(screen.getByTestId('create-index-form')).to.exist;
  });

  it('renders the index fields section', () => {
    renderWithStore();
    expect(screen.getByText('Index fields')).to.exist;
  });

  it('renders standard index options when accordion is expanded', () => {
    renderWithStore();
    expect(screen.getByTestId('create-index-modal-toggle-options')).to.exist;

    // Click to expand the options accordion
    const optionsButton = screen.getByText('Options');
    expect(optionsButton).to.exist;
    userEvent.click(optionsButton);

    expect(screen.getByTestId('create-index-modal-options')).to.exist;
  });
});
