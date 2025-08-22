import React from 'react';

import {
  shim_input_option,
  shim_polymorphic,
} from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';
const { InputOption, InputOptionContent } = shim_input_option;
const { getNodeTextContent } = shim_lib;

import { SuggestedPromptProps } from './SuggestedPrompt.types';

export const SuggestedPrompt = shim_polymorphic.InferredPolymorphic<
  SuggestedPromptProps,
  'li'
>(
  (
    {
      as = 'li' as shim_polymorphic.PolymorphicAs,
      children,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const textContent = getNodeTextContent(children);
    /**
     * If `rest[aria-label]` exists, use that;
     * if `rest['aria-labelledby']` exists, then we have no label;
     * if neither exist we set the label to `textContent`
     */
    const ariaLabel =
      rest['aria-label'] ?? (rest['aria-labelledby'] ? '' : textContent);

    return (
      <InputOption
        {...rest}
        as={as}
        ref={ref}
        className={className}
        disabled={disabled}
        aria-labelledby={rest['aria-labelledby']}
        aria-label={ariaLabel}
      >
        <InputOptionContent preserveIconSpace={false}>
          {children}
        </InputOptionContent>
      </InputOption>
    );
  },
  'SuggestedPrompt'
);

SuggestedPrompt.displayName = 'SuggestedPrompt';
