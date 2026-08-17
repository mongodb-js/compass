import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';
import { CustomToolResult } from './custom-tool-result';

const ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE =
  'tool-atlas-connection-error-debugger';

describe('CustomToolResult', function () {
  const debugResult: AtlasConnectionDebugResult = {
    cluster: 'Cluster0',
    clusterState: 'paused',
    ipAccessAllowed: true,
  };

  describe('atlas-connection-error-debugger tool', function () {
    it('renders the mapped labels and values', function () {
      render(
        <CustomToolResult
          toolType={ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE}
          output={debugResult}
        />
      );

      expect(screen.getByText('Cluster')).to.exist;
      expect(screen.getByText('Cluster0')).to.exist;

      expect(screen.getByText('State')).to.exist;
      expect(screen.getByText('PAUSED')).to.exist;

      expect(screen.getByText('IP Access')).to.exist;
      expect(screen.getByText('Client IP allowed')).to.exist;
    });

    it('formats a denied ip access result', function () {
      render(
        <CustomToolResult
          toolType={ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE}
          output={{ ...debugResult, ipAccessAllowed: false }}
        />
      );

      expect(screen.getByText('Client IP not allowed')).to.exist;
      expect(screen.queryByText('Client IP allowed')).to.not.exist;
    });

    it('falls back to N/A for missing values', function () {
      render(
        <CustomToolResult
          toolType={ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE}
          output={{ cluster: '', clusterState: '', ipAccessAllowed: false }}
        />
      );

      const naValues = screen.getAllByText('N/A');
      expect(naValues.length).to.be.greaterThanOrEqual(1);
    });
  });

  describe('for a tool without a custom result mapping', function () {
    it('does not render any configuration parameters', function () {
      render(
        <CustomToolResult toolType="tool-list-databases" output={debugResult} />
      );

      expect(screen.queryByText('Cluster')).to.not.exist;
      expect(screen.queryByText('State')).to.not.exist;
      expect(screen.queryByText('IP Access')).to.not.exist;
    });
  });
});
