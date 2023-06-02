/* eslint-disable react/prop-types */
import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { Body } from './leafygreen';
import { Tooltip } from './tooltip';
import { mergeProps } from '../utils/merge-props';

const underline = css({
  backgroundRepeat: 'repeat-x',
  backgroundPosition: 'center bottom',
  backgroundSize: '3px 2px',
  backgroundImage:
    'radial-gradient( circle closest-side, currentColor 75%, transparent 25%)',
});

const maxWidth = css({
  maxWidth: '360px',
});

const InlineDefinition: React.FunctionComponent<
  React.HTMLProps<HTMLSpanElement> & {
    definition: React.ReactNode;
    tooltipProps?: Partial<
      Omit<React.ComponentProps<typeof Tooltip>, 'trigger' | 'children'>
    >;
  }
> = ({ children, definition, tooltipProps, ...props }) => {
  return (
    <Tooltip
      justify="middle"
      spacing={5}
      trigger={({ children: tooltip, ...triggerProps }) => {
        const merged = mergeProps(
          { className: underline },
          triggerProps,
          props
        );
        return (
          <span {...merged}>
            {children}
            {tooltip}
          </span>
        );
      }}
      {...tooltipProps}
    >
      <Body className={maxWidth}>{definition}</Body>
    </Tooltip>
  );
};

export { InlineDefinition };
