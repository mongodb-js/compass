import { expect } from 'chai';
import { BaseSearchIndexModal } from './base-search-index-modal';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';
import { getCodemirrorEditorValue } from '@mongodb-js/compass-editor';

describe('Create Search Index Modal', function () {
  let onSubmitSpy: SinonSpy;
  let onCloseSpy: SinonSpy;

  beforeEach(function () {
    onSubmitSpy = sinon.spy();
    onCloseSpy = sinon.spy();

    render(
      <BaseSearchIndexModal
        mode="create"
        initialIndexName={'default'}
        initialIndexDefinition={'{}'}
        isModalOpen={true}
        isBusy={false}
        onSubmit={onSubmitSpy}
        onClose={onCloseSpy}
        error={'Invalid index definition.'}
      />
    );
  });

  afterEach(cleanup);

  describe('default behaviour', function () {
    it('uses the initial index name as the default index name', function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      expect(inputText).to.not.be.null;
      expect(inputText?.value).to.equal('default');
    });

    it('uses a dynamic mapping as the default index definition', function () {
      const defaultIndexDef = getCodemirrorEditorValue(
        'definition-of-search-index'
      );

      expect(defaultIndexDef).to.not.be.null;
      expect(defaultIndexDef).to.equal('{}');
    });
  });

  describe('form validation', function () {
    it('shows an error when the index name is empty', async function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      userEvent.clear(inputText);
      expect(await screen.findByText('Please enter the name of the index.')).to
        .exist;
    });

    it('shows server errors', async function () {
      expect(await screen.findByText('Invalid index definition.')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('closes the modal on cancel', function () {
      const cancelButton: HTMLButtonElement = screen
        .getByText('Cancel')
        .closest('button')!;

      userEvent.click(cancelButton);
      expect(onCloseSpy).to.have.been.calledOnce;
    });

    it('submits the modal on create search index', function () {
      const submitButton: HTMLButtonElement = screen
        .getByTestId('search-index-submit-button')
        .closest('button')!;

      userEvent.click(submitButton);
      expect(onSubmitSpy).to.have.been.calledOnceWithExactly('default', {});
    });
  });
});
