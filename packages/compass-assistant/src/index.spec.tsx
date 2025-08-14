import { render } from '@mongodb-js/testing-library-compass';
import { CompassAssistantProvider } from '.';
import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';
import { Chat } from './@ai-sdk/react/chat-react';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

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
      atlasService: mockAtlasService as unknown as AtlasService,
    });

    render(
      <DrawerContentProvider>
        <DrawerAnchor />
        <MockedProvider chat={new Chat({})} />
      </DrawerContentProvider>,
      {
        preferences: { enableAIAssistant: true },
      }
    );

    expect(mockAtlasService.assistantApiEndpoint.calledOnce).to.be.true;
  });
});
