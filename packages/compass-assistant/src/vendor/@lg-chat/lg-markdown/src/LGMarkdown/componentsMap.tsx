import React from 'react';

import { Language, Code } from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';
import {
  Body,
  H1,
  H2,
  H3,
  InlineCode,
  Link,
} from '@mongodb-js/compass-components';

import { LGMarkdownProps, MarkdownCodeProps } from './LGMarkdown.types';

const componentsMap: LGMarkdownProps['components'] = {
  a: ({ children, href }: shim_lib.HTMLElementProps<'a'>) => {
    return <Link href={href}>{children}</Link>;
  },
  code: ({ inline, children, className }: MarkdownCodeProps) => {
    const codeString = (children as Array<string>).join('\n');

    if (inline) {
      return <InlineCode>{codeString}</InlineCode>;
    }

    let language = className?.match(/language-(.+)/)?.[1] ?? 'none';

    const supportedLanguages = Object.values(Language);

    if (!supportedLanguages.includes(language as Language)) {
      // console.warn(
      //   `Unknown code language: ${language}. Using the default language of "none" instead.`
      // );
      language = 'none';
    }

    return <Code language={language as Language}>{codeString}</Code>;
  },
  h1: ({ children }: shim_lib.HTMLElementProps<'h1'>) => {
    return <H1>{children}</H1>;
  },
  h2: ({ children }: shim_lib.HTMLElementProps<'h2'>) => {
    return <H2>{children}</H2>;
  },
  h3: ({ children }: shim_lib.HTMLElementProps<'h3'>) => {
    return <H3>{children}</H3>;
  },
  p: ({ children, ...rest }: shim_lib.HTMLElementProps<'p'>) => {
    return <Body {...rest}>{children}</Body>;
  },
} as LGMarkdownProps['components'];

export default componentsMap;
