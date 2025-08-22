import ReactMarkdown from 'react-markdown';

import { shim_lib } from '@mongodb-js/compass-components';
import { BaseFontSize } from '@mongodb-js/compass-components';

type ReactMarkdownProps = Parameters<typeof ReactMarkdown>[0];

export interface LGMarkdownProps
  extends ReactMarkdownProps,
    shim_lib.DarkModeProps {
  baseFontSize?: BaseFontSize;
}

export type MarkdownCodeProps = shim_lib.HTMLElementProps<'code'> & {
  inline?: boolean;
};
