/* eslint-disable react/prop-types */
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { useTooltipTrigger } from '@react-aria/tooltip';
import React, { useCallback, useRef } from 'react';
import { Tooltip as LeafyGreenTooltip } from './leafygreen';
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
type LeafyGreenTooltipProps = React.ComponentPropsWithoutRef<
  typeof LeafyGreenTooltip
>;

type TooltipTrigger = React.FunctionComponent;

const Tooltip: React.FunctionComponent<
  TooltipTriggerProps &
    Omit<LeafyGreenTooltipProps, 'open' | 'setOpen' | 'trigger'> & {
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
    <LeafyGreenTooltip
      open={!isDisabled && tooltipState.isOpen}
      setOpen={setOpen}
      trigger={({ children, className }: React.HTMLProps<HTMLElement>) => {
        return trigger(mergeProps({ children, className }, triggerProps));
      }}
      {...rest}
      {...tooltipProps}
    ></LeafyGreenTooltip>
  );
};

export { Tooltip };
