/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import ComponentPreview from 'storybook/decorators/componentPreview';
import { withChaptersOptions } from 'constants/storybook';

import Security from 'components/Security';

storiesOf('Security', module)
  .addWithChapters('Example Title', {
    chapters: [
      {
        title: 'Visible',
        sections: [
          {
            title: 'No Plugins',
            sectionFn: () => (
              <ComponentPreview dark>
                <Security isVisible />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          },
          {
            title: 'Core Plugins',
            sectionFn: () => (
              <ComponentPreview dark>
                <Security isVisible />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          },
          {
            title: 'External Plugins',
            sectionFn: () => (
              <ComponentPreview dark>
                <Security isVisible />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  });

/* eslint-enable react/no-multi-comp */
