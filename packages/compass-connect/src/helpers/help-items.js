/* eslint-disable react/no-multi-comp */

import React from 'react';
import Actions from '../actions';

import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

import {
  CONNECTION_FORM_VIEW,
  CONNECTION_STRING_VIEW
} from '../constants/connection-views';

/**
 * Visits help page.
 *
 * @param {String} href - An external link.
 * @param {String} appRegistryEvent - appRegistry event.
 * @param {Object} componentEvent - A component event.
 * @param {Function} handler - Additional custom code to be run on click.
 */
const onExternalLinkClicked = (href, appRegistryEvent, handler, componentEvent) => {
  componentEvent.preventDefault();
  Actions.onExternalLinkClicked(href, appRegistryEvent);
  if (handler) {
    handler();
  }
};

/**
 * Counts created links to provide unique keys for a link component.
 */
let linkCounter = 0;

/**
 * Counts created paragraphs to provide unique keys for a paragraph component.
 */
let paragraphCounter = 0;

/**
 * Creates a link component.
 *
 * @param {String} href - A href for the link.
 * @param {String} text - A text for the link.
 * @param {Object} event - appRegistry event if needed.
 * @param {Function} handler - Additional custom code to be run on click.
 *
 * @returns {React.Component}
 */
const createLink = (href, text, event, handler) => React.createElement(
  'a',
  {
    key: `a${linkCounter++}`,
    onClick: onExternalLinkClicked.bind(this, href, event, handler)
  },
  text
);

/**
 * Creates a button-info component.
 *
 * @param {String} href - A href that should be opened externally
 * when the button clicked.
 * @param {String} text - A text for the button.
 * @param {Object} event - appRegistry event if needed.
 * @param {Function} handler - Additional custom code to be run on click.
 *
 * @returns {React.Component}
 */
const createButton = (href, text, event, handler) => React.createElement(
  'button',
  {
    type: 'button',
    name: 'atlasLink',
    key: 'atlasLink',
    className: 'btn btn-sm btn-info',
    onClick: onExternalLinkClicked.bind(this, href, event, handler)
  },
  text
);

/**
 * Creates a paragraph component.
 *
 * @param {Array} contect - A content for a paragraph.
 *
 * @returns {React.Component}
 */
const createParagraph = (contect) => React.createElement(
  'p',
  { key: `p${paragraphCounter++}` },
  ...contect
);

/**
 * Components for help items depending on viewType.
 */
export const HelpItems = {
  [CONNECTION_FORM_VIEW]: [
    {
      title: 'How do I find my username and password?',
      body: createParagraph([
        'If your mongod instance has authentication set up, you\'ll need the credentials of the MongoDB user that is configured on the project.'
      ])
    }
  ],
  [CONNECTION_STRING_VIEW]: [
    {
      title: 'How do I find my connection string in Atlas?',
      body: [
        createParagraph([
          'If you have an Atlas cluster, go to the Cluster view. Click the \'Connect\' button for the cluster to which you wish to connect.'
        ]),
        createParagraph([
          createLink(
            'https://docs.atlas.mongodb.com/compass-connection/',
            'See example'
          )
        ])
      ]
    },
    {
      title: 'How do I format my connection string?',
      body: createParagraph([
        createLink(
          'https://docs.mongodb.com/manual/reference/connection-string/',
          'See example'
        )
      ])
    }
  ]
};

/**
 * Еhe "New to Compass and don't have a cluster?" green box on
 * the righthand side of the connect screen
 */
export const AtlasLink = {
  title: 'New to Compass and don\'t have a cluster?',
  body: [
    createParagraph([
      'If you don\'t already have a cluster, you can create one for free using ',
      createLink(
        'https://www.mongodb.com/cloud/atlas',
        'MongoDB Atlas'
      ),
      '.'
    ]),
    createParagraph([
      createButton(
        'https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product',
        'Create Free Cluster',
        'create-atlas-cluster-clicked',
        () => track('Atlas Link Clicked', { screen: 'connect' })
      )
    ])
  ]
};
