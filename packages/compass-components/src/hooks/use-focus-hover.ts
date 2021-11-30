import {
  useFocusVisible,
  useFocus,
  useFocusWithin,
} from '@react-aria/interactions';
import React, { useState } from 'react';

export enum FocusState {
  NoFocus = 'NoFocus',
  FocusVisible = 'FocusVisible',
  Focus = 'Focus',
  FocusWithinVisible = 'FocusWithinVisible',
  FocusWithin = 'FocusWithin',
}

export function useFocusState(): [
  React.HTMLAttributes<HTMLElement>,
  FocusState
] {
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { isFocusVisible } = useFocusVisible();
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });
  const { focusProps } = useFocus({
    onFocusChange: setIsFocused,
  });
  const mergedProps = {
    onFocus(evt: React.FocusEvent<HTMLElement>) {
      focusProps.onFocus?.(evt);
      focusWithinProps.onFocus?.(evt);
    },
    onBlur(evt: React.FocusEvent<HTMLElement>) {
      focusProps.onBlur?.(evt);
      focusWithinProps.onBlur?.(evt);
    },
  };
  return [
    mergedProps,
    isFocused && isFocusVisible
      ? FocusState.FocusVisible
      : isFocused
      ? FocusState.Focus
      : isFocusWithin && isFocusVisible
      ? FocusState.FocusWithinVisible
      : isFocusWithin
      ? FocusState.FocusWithin
      : FocusState.NoFocus,
  ];
}

export function useHoverState(): [React.HTMLAttributes<HTMLElement>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = {
    onMouseEnter() {
      setIsHovered(true);
    },
    onMouseLeave() {
      setIsHovered(false);
    },
  };
  return [hoverProps, isHovered];
}
