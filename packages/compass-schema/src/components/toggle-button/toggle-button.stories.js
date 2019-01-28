/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ComponentPreview from 'storybook/decorators/componentPreview';
import { withChaptersOptions } from 'constants/storybook';
import { ToggleButton } from 'components/toggle-button';

storiesOf('ToggleButton', module)
  .addWithChapters('Example Title', {
    subtitle: 'Dolor laborum',
    info: 'Lorem ipsum aliquip irure laborum ut mollit tempor velit occaecat amet excepteur laboris commodo culpa magna aliqua cupidatat id dolor dolore qui dolor sed tempor officia dolor in ex sit officia velit laborum culpa eiusmod anim cupidatat eiusmod esse culpa.',
    chapters: [
      {
        title: 'In dolor reprehenderit nisi',
        subtitle: 'Lorem ipsum',
        info: 'Dolor sunt sint aliquip ut ullamco excepteur qui dolore laborum voluptate ex irure et velit et excepteur ad dolore velit id tempor cupidatat excepteur laboris consectetur id minim ut do non aute ex nisi incididunt.',
        sections: [
          {
            title: 'Exercitation dolore enim et',
            subtitle: 'Nostrud amet minim exercitation',
            info: 'Lorem ipsum irure ut exercitation ut dolore ut consequat in mollit aute voluptate est reprehenderit fugiat in dolor consectetur eu.',
            sectionFn: () => (
              <ComponentPreview dark>
                <ToggleButton onClick={action('Button clicked')}>Button Text</ToggleButton>
              </ComponentPreview>
            ),
            options: withChaptersOptions
          }
        ]
      }
    ]
  });

/* eslint-enable react/no-multi-comp */
