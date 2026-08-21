import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';
import { CustomToolResult } from './custom-tool-result';

const ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE =
  'tool-atlas-connection-error-debugger';

describe('CustomToolResult', function () {
  const debugResult: AtlasConnectionDebugResult = {
    clusterName: 'Cluster0',
    clusterState: 'PAUSED',
    ipAccessStatus: 'Client IP Allowed',
    links: {
      clusterOverview:
        'https://cloud.mongodb.com/v2/p1#/clusters/detail/Cluster0',
    },
  };

  function renderWithArguments({
    title = 'Atlas Check Result:',
    toolType = ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE,
    output = debugResult,
  }: {
    title?: string;
    toolType?: string;
    output?: unknown;
  } = {}) {
    render(
      <CustomToolResult title={title} toolType={toolType} output={output} />
    );
  }

  describe('atlas-connection-error-debugger tool', function () {
    it('renders the title', function () {
      renderWithArguments();

      expect(screen.getByText('Atlas Check Result:')).to.exist;
    });

    it('renders the mapped labels and values', function () {
      renderWithArguments();

      expect(screen.getByText('Cluster')).to.exist;
      expect(screen.getByText('Cluster0')).to.exist;

      expect(screen.getByText('State')).to.exist;
      expect(screen.getByText('PAUSED')).to.exist;

      expect(screen.getByText('IP Access')).to.exist;
      expect(screen.getByText('Client IP Allowed')).to.exist;
    });

    it('renders the cluster name as a link to the cluster overview', function () {
      renderWithArguments();

      expect(screen.getByText('Cluster0').closest('a')).to.have.attribute(
        'href',
        'https://cloud.mongodb.com/v2/p1#/clusters/detail/Cluster0'
      );
    });

    it('renders an unconfirmed ip access status as a link to the access list', function () {
      const networkAccessList =
        'https://cloud.mongodb.com/v2/p1#/security/network/accessList';
      renderWithArguments({
        output: {
          ...debugResult,
          ipAccessStatus: 'Could not confirm',
          links: { ...debugResult.links, networkAccessList },
        },
      });

      expect(screen.queryByText('Client IP Allowed')).to.not.exist;
      expect(
        screen.getByText('Could not confirm').closest('a')
      ).to.have.attribute('href', networkAccessList);
    });

    it('renders values as plain text when there are no links', function () {
      renderWithArguments({
        output: {
          clusterName: 'Unknown',
          clusterState: 'Unknown',
          ipAccessStatus: 'Could not confirm',
        },
      });

      expect(screen.getAllByText('Unknown')).to.have.lengthOf(2);
      expect(screen.getByText('Could not confirm').closest('a')).to.be.null;
    });
  });

  describe('for a tool without a custom result mapping', function () {
    it('does not render any configuration parameters', function () {
      renderWithArguments({ toolType: 'tool-list-databases' });

      expect(screen.queryByText('Cluster')).to.not.exist;
      expect(screen.queryByText('State')).to.not.exist;
      expect(screen.queryByText('IP Access')).to.not.exist;
    });
  });
});
