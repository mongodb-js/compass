declare module '*.css' {
  export default undefined;
}

// @via-ds/components is "type": "module", and with our `nodenext` module
// resolution TypeScript requires relative imports in such packages to include
// the file extension. The package's .d.ts re-exports (`export * from './Text'`)
// don't, so TypeScript can't follow them and `Text` is reported as missing.
declare module '@via-ds/components/typography' {
  import type { CSSProperties, ReactNode, Ref } from 'react';

  export const Text: React.FunctionComponent<{
    ref?: Ref<HTMLElement>;
    slot?: string;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }>;
}
