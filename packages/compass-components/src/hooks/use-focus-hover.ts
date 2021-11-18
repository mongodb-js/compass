import { useFocusVisible, useFocus } from '@react-aria/interactions';
import React, { useState } from 'react';

export enum FocusState {
  NoFocus,
  FocusVisible,
  Focus,
}

export function useFocusState(): [
  React.HTMLAttributes<HTMLElement>,
  FocusState
] {
  const [isFocused, setIsFocused] = useState(false);
  const { isFocusVisible } = useFocusVisible();
  const { focusProps } = useFocus({
    onFocusChange(newVal) {
      setIsFocused(newVal);
    },
  });
  return [
    focusProps,
    isFocused && isFocusVisible
      ? FocusState.FocusVisible
      : isFocused
      ? FocusState.Focus
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
