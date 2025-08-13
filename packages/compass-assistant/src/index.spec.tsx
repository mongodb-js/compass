import { render } from '@mongodb-js/testing-library-compass';
import { CompassAssistantProvider } from '.';
import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';

describe('CompassAssistantProvider', function () {
  beforeEach(function () {
    process.env.COMPASS_ASSISTANT_USE_ATLAS_SERVICE_URL = 'true';
  });

  afterEach(function () {
    delete process.env.COMPASS_ASSISTANT_USE_ATLAS_SERVICE_URL;
  });

  it('uses the Atlas Service assistantApiEndpoint', function () {
    const mockAtlasService = {
      assistantApiEndpoint: sinon
        .stub()
        .returns('https://atlas-assistant-api.example.com/api/v1'),
    };

    const MockedProvider = CompassAssistantProvider.withMockServices({
      atlasService: mockAtlasService,
    });

    render(
      <DrawerContentProvider>
        <DrawerAnchor />
        <MockedProvider />
      </DrawerContentProvider>,
      {
        preferences: { enableAIAssistant: true },
      }
    );

    expect(mockAtlasService.assistantApiEndpoint.calledOnce).to.be.true;
  });
});
