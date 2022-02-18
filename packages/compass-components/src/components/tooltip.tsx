/* eslint-disable react/prop-types */
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { useTooltipTrigger } from '@react-aria/tooltip';
import LeafygreenTooltip from '@leafygreen-ui/tooltip';
import React, { useCallback, useRef } from 'react';
import { mergeProps } from '../utils/merge-props';

/**
 * @see {@link https://react-spectrum.adobe.com/react-aria/useTooltipTrigger.html}
 */
type TooltipTriggerProps = {
  isDisabled?: boolean;
  delay?: number;
  triggerOn?: 'focus';
};

/**
 * @see {@link https://www.mongodb.design/component/tooltip/documentation/}
 */
type LeafygreenTooltipProps = React.ComponentPropsWithoutRef<
  typeof LeafygreenTooltip
>;

type TooltipTrigger = React.FunctionComponent;

const Tooltip: React.FunctionComponent<
  TooltipTriggerProps &
    Omit<LeafygreenTooltipProps, 'open' | 'setOpen' | 'trigger'> & {
      trigger: TooltipTrigger;
    }
> = ({ isDisabled, triggerOn, delay, trigger, ...rest }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const tooltipState = useTooltipTriggerState({
    isDisabled,
    trigger: triggerOn,
    delay,
  });
  const { triggerProps, tooltipProps } = useTooltipTrigger(
    { isDisabled, trigger: triggerOn },
    tooltipState,
    ref
  );
  const setOpen = useCallback(
    (isOpen) => {
      if (isOpen) {
        tooltipState.open();
      } else {
        tooltipState.close();
      }
    },
    [tooltipState]
  );
  return (
    <LeafygreenTooltip
      open={tooltipState.isOpen}
      setOpen={setOpen}
      trigger={({ children, className }: React.HTMLProps<HTMLElement>) => {
        return trigger(mergeProps({ children, className }, triggerProps));
      }}
      {...rest}
      {...tooltipProps}
    ></LeafygreenTooltip>
  );
};

export { Tooltip };
