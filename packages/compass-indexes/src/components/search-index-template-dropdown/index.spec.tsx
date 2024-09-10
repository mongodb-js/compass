import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import { expect } from 'chai';
import { SearchIndexTemplateDropdown } from './';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import React from 'react';

const knnVectorText = 'KNN Vector field mapping';

function templateNamed(name: string) {
  return ATLAS_SEARCH_TEMPLATES.find((t) => t.name === name);
}

describe('Search Index Template Dropdown', function () {
  afterEach(cleanup);

  describe('when rendered', function () {
    let onTemplateSpy: SinonSpy;

    beforeEach(function () {
      onTemplateSpy = sinon.spy();

      render(
        <SearchIndexTemplateDropdown
          tooltip="Tooltip"
          isVectorSearchSupported
          onTemplate={onTemplateSpy}
        />
      );
    });

    it('notifies upwards with onTemplate when a new template is chosen', async function () {
      const dropDown = screen
        .getByText('Dynamic field mappings')
        .closest('button')!;

      userEvent.click(dropDown);

      const staticFieldMappingOption = await screen.findByText(
        'Static field mappings'
      );
      userEvent.click(staticFieldMappingOption);

      expect(onTemplateSpy).to.have.been.calledWith(
        templateNamed('Static field mappings')
      );
    });

    it('does not shows the knn vector search template', function () {
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      expect(screen.queryByRole('option', { name: knnVectorText })).to.not
        .exist;
    });
  });

  describe('when rendered with vector search disabled', function () {
    beforeEach(function () {
      render(
        <SearchIndexTemplateDropdown
          tooltip="Tooltip"
          isVectorSearchSupported={false}
          onTemplate={() => {}}
        />
      );
    });

    it('shows the knn vector search template', function () {
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      expect(screen.getByRole('option', { name: knnVectorText })).to.be.visible;
    });
  });
});
