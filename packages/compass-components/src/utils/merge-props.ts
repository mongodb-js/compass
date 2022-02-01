import type React from 'react';
import { mergeProps as _mergeProps } from '@react-aria/utils';

export function mergeProps<T extends HTMLElement = HTMLElement>(
  ...props: React.HTMLProps<T>[]
): typeof props[number] {
  const propsWithRefs = props.filter((prop) => prop.ref);
  return {
    // This mergeProps method can handle callbacks and class names, but not refs
    ..._mergeProps(...props),
    ...(propsWithRefs.length > 0 && {
      ref(val: T) {
        propsWithRefs.forEach(({ ref }) => {
          if (typeof ref === 'function') {
            ref(val);
          } else if (ref && typeof ref === 'object') {
            (ref as React.MutableRefObject<T>).current = val;
          }
        });
      },
    }),
  };
}
