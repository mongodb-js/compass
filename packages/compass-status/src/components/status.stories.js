/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import ComponentPreview from 'storybook/decorators/componentPreview';
import { withChaptersOptions } from 'constants/storybook';

import Status from 'components/status';

storiesOf('Status', module)
  .addWithChapters('Progress Bar (Not Visible)', {
    chapters: [
      {
        sections: [
          {
            sectionFn: () => (
              <ComponentPreview light>
                <Status />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  })
  .addWithChapters('Progress Bar (50%)', {
    chapters: [
      {
        sections: [
          {
            sectionFn: () => (
              <ComponentPreview light>
                <Status visible progressbar progress={50} />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  })
  .addWithChapters('Animation (No Message)', {
    chapters: [
      {
        sections: [
          {
            sectionFn: () => (
              <ComponentPreview light>
                <Status visible animation />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  })
  .addWithChapters('Animation (With Message)', {
    chapters: [
      {
        sections: [
          {
            sectionFn: () => (
              <ComponentPreview light>
                <Status visible animation message="Loading" />
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  });

/* eslint-enable react/no-multi-comp */
