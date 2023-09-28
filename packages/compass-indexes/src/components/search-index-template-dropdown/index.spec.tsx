import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import { expect } from 'chai';
import { SearchIndexTemplateDropdown } from './';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';

function templateNamed(name: string) {
  return ATLAS_SEARCH_TEMPLATES.find((t) => t.name === name);
}

describe('Search Index Template Dropdown', function () {
  let onTemplateSpy: SinonSpy;

  beforeEach(function () {
    onTemplateSpy = sinon.spy();

    render(
      <SearchIndexTemplateDropdown
        tooltip="Tooltip"
        onTemplate={onTemplateSpy}
      />
    );
  });

  afterEach(cleanup);

  it('notifies upwards with onTemplate when a new template is choosen', async function () {
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
});
