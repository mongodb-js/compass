import React from 'react';
import ReactMarkdown from 'react-markdown';

import { cx } from '@mongodb-js/compass-components';
import LeafyGreenProvider, {
  shim_useDarkMode,
} from '@mongodb-js/compass-components';
import { useUpdatedBaseFontSize } from '@mongodb-js/compass-components';

import componentsMap from './componentsMap';
import { baseStyles } from './LGMarkdown.styles';
import { LGMarkdownProps } from '.';

export const LGMarkdown = ({
  children,
  className,
  components,
  darkMode: darkModeProp,
  baseFontSize: baseFontSizeProp,
  ...rest
}: LGMarkdownProps) => {
  const { darkMode } = shim_useDarkMode(darkModeProp);
  const baseFontSize = useUpdatedBaseFontSize(baseFontSizeProp); // get context base font size
  const providerBaseFontSize: 14 | 16 = baseFontSize === 13 ? 14 : 16; // todo: update when LGProvider switches to 13/16
  return (
    <LeafyGreenProvider darkMode={darkMode} baseFontSize={providerBaseFontSize}>
      <ReactMarkdown
        components={{ ...componentsMap, ...components }}
        className={cx(baseStyles, className)}
        {...rest}
      >
        {children}
      </ReactMarkdown>
    </LeafyGreenProvider>
  );
};

LGMarkdown.displayName = 'LGMarkdown';
