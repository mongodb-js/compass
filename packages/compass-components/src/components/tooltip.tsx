/* eslint-disable react/prop-types */
import { useTooltipTriggerState } from '@react-stately/tooltip';
import { useTooltipTrigger } from '@react-aria/tooltip';
import React, { useCallback, useRef } from 'react';
import LeafyGreenTooltip from '@leafygreen-ui/tooltip';
import { mergeProps } from '../utils/merge-props';
import { Theme, ThemeProvider, useTheme } from '../hooks/use-theme';

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
    Omit<LeafyGreenTooltipProps, 'trigger'> & {
      trigger: TooltipTrigger;
    }
> = ({ isDisabled, triggerOn, delay, trigger, children, ...rest }) => {
  const theme = useTheme();

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
      darkMode={theme.theme === Theme.Dark}
      open={!isDisabled && tooltipState.isOpen}
      setOpen={setOpen}
      trigger={({ children, className }: React.HTMLProps<HTMLElement>) => {
        return trigger(mergeProps({ children, className }, triggerProps));
      }}
      {...rest}
      {...tooltipProps}
    >
      <ThemeProvider
        theme={{
          enabled: true,
          // invert the theme for components inside the tooltip
          theme: theme.theme === Theme.Dark ? Theme.Light : Theme.Dark,
        }}
      >
        {children}
      </ThemeProvider>
    </LeafyGreenTooltip>
  );
};

export { Tooltip };
