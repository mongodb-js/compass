import {
  useFocusVisible,
  useFocus,
  useFocusWithin,
} from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';

export enum FocusState {
  NoFocus = 'NoFocus',
  FocusVisible = 'FocusVisible',
  Focus = 'Focus',
  FocusWithinVisible = 'FocusWithinVisible',
  FocusWithin = 'FocusWithin',
}

function getFocusState(
  isFocused: boolean,
  isFocusWithin: boolean,
  isFocusVisible: boolean
) {
  return isFocused && isFocusVisible
    ? FocusState.FocusVisible
    : isFocused
    ? FocusState.Focus
    : isFocusWithin && isFocusVisible
    ? FocusState.FocusWithinVisible
    : isFocusWithin
    ? FocusState.FocusWithin
    : FocusState.NoFocus;
}

export function useFocusState(): [
  React.HTMLAttributes<HTMLElement>,
  FocusState,
  React.MutableRefObject<FocusState>
] {
  const focusStateRef = useRef(FocusState.NoFocus);
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { isFocusVisible } = useFocusVisible();
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });
  const { focusProps } = useFocus({
    onFocusChange: setIsFocused,
  });
  const mergedProps = useMemo(() => {
    return mergeProps(focusProps, focusWithinProps);
  }, [focusProps, focusWithinProps]);
  focusStateRef.current = getFocusState(
    isFocused,
    isFocusWithin,
    isFocusVisible
  );
  return [mergedProps, focusStateRef.current, focusStateRef];
}

export function useHoverState(): [
  React.HTMLAttributes<HTMLElement>,
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>
] {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = {
    onMouseEnter() {
      setIsHovered(true);
    },
    onMouseLeave() {
      setIsHovered(false);
    },
  };
  return [hoverProps, isHovered, setIsHovered];
}
