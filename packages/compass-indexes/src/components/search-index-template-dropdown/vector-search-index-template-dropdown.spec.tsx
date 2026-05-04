import { ATLAS_VECTOR_SEARCH_TEMPLATE } from '@mongodb-js/mongodb-constants';
import { expect } from 'chai';
import { VectorSearchIndexTemplateDropdown } from './vector-search-index-template-dropdown';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';

import React from 'react';

describe('Vector Search Index Template Dropdown', function () {
  describe('when rendered', function () {
    let onTemplateChoiceSpy: SinonSpy;

    beforeEach(function () {
      onTemplateChoiceSpy = sinon.spy();
    });

    it('notifies upwards when Bring your own embeddings is chosen', async function () {
      render(
        <VectorSearchIndexTemplateDropdown
          tooltip="Tooltip"
          value="autoEmbed"
          onTemplateChoice={onTemplateChoiceSpy}
        />
      );
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      const option = await screen.findByRole('option', {
        name: 'Bring your own embeddings',
      });
      userEvent.click(option);

      expect(onTemplateChoiceSpy).to.have.been.calledWith(
        'bringYourOwn',
        ATLAS_VECTOR_SEARCH_TEMPLATE
      );
    });

    it('notifies upwards when Automated embedding is chosen', async function () {
      render(
        <VectorSearchIndexTemplateDropdown
          tooltip="Tooltip"
          value="bringYourOwn"
          onTemplateChoice={onTemplateChoiceSpy}
        />
      );
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      const option = await screen.findByRole('option', {
        name: 'Automated embedding',
      });
      userEvent.click(option);

      expect(onTemplateChoiceSpy).to.have.been.calledOnce;
      expect(onTemplateChoiceSpy.firstCall.args[0]).to.equal('autoEmbed');
      expect(onTemplateChoiceSpy.firstCall.args[1].name).to.equal(
        'Automated embedding'
      );
    });
  });
});
