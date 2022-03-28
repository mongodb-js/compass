import { useCallback } from 'react';

/**
 * Augments a component with default action handling. Default action refers to
 * the action produced by button-like interaction with the UI element: click or
 * space / enter key press
 *
 * @param onDefaultAction Action callback
 * @returns Props that should be passed to the component
 */
export function useDefaultAction<T>(
  onDefaultAction: (evt: React.KeyboardEvent<T> | React.MouseEvent<T>) => void
): React.HTMLAttributes<T> {
  const onClick = useCallback(
    (evt: React.MouseEvent<T>) => {
      evt.stopPropagation();
      onDefaultAction(evt);
    },
    [onDefaultAction]
  );

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<T>) => {
      if (
        // Only handle keyboard events if they originated on the element
        evt.target === evt.currentTarget &&
        [' ', 'Enter'].includes(evt.key)
      ) {
        evt.preventDefault();
        evt.stopPropagation();
        onDefaultAction(evt);
      }
    },
    [onDefaultAction]
  );

  return { onClick, onKeyDown };
}
