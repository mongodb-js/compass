import ReactMarkdown from 'react-markdown';

import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';
import { BaseFontSize } from '@mongodb-js/compass-components';

type ReactMarkdownProps = Parameters<typeof ReactMarkdown>[0];

export interface LGMarkdownProps extends ReactMarkdownProps, DarkModeProps {
  baseFontSize?: BaseFontSize;
}

export type MarkdownCodeProps = HTMLElementProps<'code'> & {
  inline?: boolean;
};
