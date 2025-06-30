import React from 'react';
import { render, screen, fireEvent } from '@mongodb-js/testing-library-compass';
import { CreateIndexForm } from './create-index-form';
import type { Field } from '../../modules/create-index';
import { expect } from 'chai';
import type { SinonSpy } from 'sinon';

import { setupStore } from '../../../test/setup-store';
import sinon from 'sinon';
import { Provider } from 'react-redux';

describe('CreateIndexForm', () => {
  let onTabClickSpy: SinonSpy;
  const store = setupStore();

  beforeEach(function () {
    onTabClickSpy = sinon.spy();
  });

  const renderComponent = ({
    showIndexesGuidanceVariant,
  }: {
    showIndexesGuidanceVariant?: boolean;
  }) => {
    render(
      <Provider store={store}>
        <CreateIndexForm
          namespace="testNamespace"
          fields={
            [
              { name: 'field1', type: 'string' },
              { name: 'field2', type: 'number' },
            ] as Field[]
          }
          serverVersion="5.0.0"
          currentTab="IndexFlow"
          onSelectFieldNameClick={() => {}}
          onSelectFieldTypeClick={() => {}}
          onAddFieldClick={() => {}}
          onRemoveFieldClick={() => {}}
          onTabClick={onTabClickSpy}
          showIndexesGuidanceVariant={showIndexesGuidanceVariant || false}
          query={null}
        />
      </Provider>
    );
  };

  it('renders the create index form', () => {
    renderComponent({});
    expect(screen.getByTestId('create-index-form')).to.exist;
  });

  describe('when showIndexesGuidanceVariant is false', () => {
    it('renders the RadioBoxGroup', () => {
      renderComponent({});
      expect(screen.queryByTestId('create-index-form-flows')).not.to.exist;
    });
  });

  describe('when showIndexesGuidanceVariant is true', () => {
    it('renders the RadioBoxGroup', () => {
      renderComponent({ showIndexesGuidanceVariant: true });
      expect(screen.getByTestId('create-index-form-flows')).to.exist;
    });
    it('calls onTabClick when a RadioBox is selected', () => {
      renderComponent({ showIndexesGuidanceVariant: true });
      const radioBox = screen.getByLabelText('Start with a Query');
      fireEvent.click(radioBox);
      expect(onTabClickSpy).to.be.calledWith('QueryFlow');
    });
  });
});
