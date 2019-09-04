/* eslint-disable react/no-multi-comp */

import React from 'react';
import Actions from 'actions';

/**
 * Visits help page.
 *
 * @param {String} href - An external link.
 * @param {String} appRegistryEvent - appRegistry event.
 * @param {Object} componentEvent - A component event.
 */
const onExternalLinkClicked = (href, appRegistryEvent, componentEvent) => {
  componentEvent.preventDefault();
  Actions.onExternalLinkClicked(href, appRegistryEvent);
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
 *
 * @returns {React.Component}
 */
const createLink = (href, text, event) => React.createElement(
  'a',
  {
    key: `a${linkCounter++}`,
    onClick: onExternalLinkClicked.bind(this, href, event)
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
const HelpItems = {
  'connectionForm': [
    {
      title: 'What do I need in order to connect?',
      body: createParagraph([
        'If you don\'t have a running cluster, you can ',
        createLink(
          'https://www.mongodb.com/cloud/atlas/lp/general?jmp=compass',
          'spin up a free cluster using MongoDB Atlas',
          'create-atlas-cluster-learn-more-clicked'
        ),
        '.'
      ])
    },
    {
      title: 'How do I find my username and password?',
      body: createParagraph([
        'If your mongod instance has authentication set up, you\'ll need the credentials of the MongoDB user that is configured on the project.'
      ])
    }
  ],
  'connectionString': [
    {
      title: 'What do I need in order to connect?',
      body: createParagraph([
        'If you don\'t have a running cluster, you can ',
        createLink(
          'https://www.mongodb.com/cloud/atlas/lp/general?jmp=compass',
          'spin up a free cluster using MongoDB Atlas',
          'create-atlas-cluster-learn-more-clicked'
        ),
        '.'
      ])
    },
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

export default HelpItems;
