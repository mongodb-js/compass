import {
  useFocusVisible,
  useFocus,
  useFocusWithin,
} from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export const FocusStates = {
  NoFocus: 'NoFocus',
  FocusVisible: 'FocusVisible',
  Focus: 'Focus',
  FocusWithinVisible: 'FocusWithinVisible',
  FocusWithin: 'FocusWithin',
} as const;

export type FocusState = (typeof FocusStates)[keyof typeof FocusStates];

function getFocusState(
  isFocused: boolean,
  isFocusWithin: boolean,
  isFocusVisible: boolean
) {
  return isFocused && isFocusVisible
    ? FocusStates.FocusVisible
    : isFocused
    ? FocusStates.Focus
    : isFocusWithin && isFocusVisible
    ? FocusStates.FocusWithinVisible
    : isFocusWithin
    ? FocusStates.FocusWithin
    : FocusStates.NoFocus;
}

export function useFocusState(): [
  React.HTMLAttributes<HTMLElement>,
  FocusState,
  React.MutableRefObject<FocusState>
] {
  const focusStateRef = useRef<FocusState>(FocusStates.NoFocus);
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

function checkBodyFocused(): boolean {
  const { documentElement, activeElement, body } = document;
  return (
    activeElement === documentElement ||
    activeElement === body ||
    !activeElement
  );
}

function useIsDocumentUnfocused() {
  const [isBodyFocused, setIsBodyFocused] = useState(checkBodyFocused());

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    const listener = () => {
      setIsBodyFocused(checkBodyFocused());
    };
    for (const el of [document.body, document.documentElement]) {
      for (const ev of ['focus', 'blur', 'focusin', 'focusout']) {
        el.addEventListener(ev, listener);
        cleanup.push(() => el.removeEventListener(ev, listener));
      }
    }
    return () => {
      for (const cb of cleanup) {
        cb();
      }
    };
  }, [setIsBodyFocused]);

  return isBodyFocused;
}

export function useFocusStateIncludingUnfocused(): [
  React.HTMLAttributes<HTMLElement>,
  FocusState | 'Unfocused',
  React.MutableRefObject<FocusState | 'Unfocused'>
] {
  const focusStateRef = useRef<FocusState | 'Unfocused'>(FocusStates.NoFocus);
  const [props, state] = useFocusState();
  const isUnfocused = useIsDocumentUnfocused();
  const extendedState = isUnfocused ? 'Unfocused' : state;

  focusStateRef.current = extendedState;
  return [props, extendedState, focusStateRef];
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
