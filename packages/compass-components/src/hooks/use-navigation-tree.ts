import React, { useRef, useCallback, useEffect } from 'react';

function findAllTreeItems(root: HTMLElement, level = 1): HTMLElement[] {
  return (
    Array.from(
      root.querySelectorAll<HTMLElement>(
        `[role="treeitem"][aria-level="${level}"]`
      ) ?? []
    )
      .map((item) => {
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        return [item].concat(
          isExpanded ? findAllTreeItems(item, level + 1) : []
        );
      })
      // TODO: change compiler.lib
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      .flat()
  );
}

function findAllNodesInSet(node: HTMLElement) {
  let cursor = node.parentElement?.firstElementChild;
  const level = node.getAttribute('aria-level');
  const siblings: HTMLElement[] = [cursor as HTMLElement];
  while (cursor?.nextElementSibling) {
    if (cursor?.nextElementSibling.getAttribute('aria-level') === level) {
      siblings.push(cursor?.nextElementSibling as HTMLElement);
    }
    cursor = cursor?.nextElementSibling;
  }
  return siblings;
}

function findParentTreeItem(node: HTMLElement): HTMLElement | null {
  const parentLevel = String(Number(node.getAttribute('aria-level')) - 1);
  if (parentLevel === '0') {
    return null;
  }
  let parentNode: HTMLElement | null = node;
  while ((parentNode = parentNode.parentElement)) {
    if (parentNode && parentNode.getAttribute('aria-level') === parentLevel) {
      return parentNode;
    }
  }
  return null;
}

const DEFAULT_TABBABLE = '[aria-level="1"]';

/**
 * Manages the focus on the navigation tree using the roving tabindex flow
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-2/treeview-2b.html}
 * @see {@link https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_roving_tabindex}
 */
export function useTree({
  tabbableSelector = DEFAULT_TABBABLE,
  onExpandedChange,
}: {
  tabbableSelector?: string;
  onExpandedChange(id: string, isExpanded: boolean): void;
}): React.HTMLAttributes<HTMLUListElement> & {
  ref: React.RefObject<HTMLUListElement>;
} {
  const ref = useRef<HTMLUListElement>(null);

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLUListElement>) => {
      if (!ref.current) {
        return;
      }

      const nodes = findAllTreeItems(ref.current);
      const currentFocusElement = nodes.find(
        (node) => node === document.activeElement
      );

      if (!currentFocusElement) {
        return;
      }

      const currentFocusElementIndex = nodes.indexOf(currentFocusElement);

      let nextFocusElementIndex = -1;

      if (evt.key === 'Home') {
        nextFocusElementIndex = 0;
      }

      if (evt.key === 'End') {
        nextFocusElementIndex = nodes.length - 1;
      }

      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        evt.stopPropagation();

        nextFocusElementIndex = currentFocusElementIndex + 1;
      }

      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        evt.stopPropagation();

        nextFocusElementIndex = currentFocusElementIndex - 1;
      }

      if (evt.key === 'ArrowRight') {
        evt.stopPropagation();

        if (currentFocusElement.getAttribute('aria-expanded') === 'false') {
          onExpandedChange(currentFocusElement.dataset.id as string, true);
        }

        if (currentFocusElement.getAttribute('aria-expanded') === 'true') {
          const currentFocusElementLevel = Number(
            currentFocusElement.getAttribute('aria-level')
          );
          const maybeNextFocusElementIndex = currentFocusElementIndex + 1;
          const maybeNextFocusElement = nodes[maybeNextFocusElementIndex];
          if (
            maybeNextFocusElement &&
            Number(maybeNextFocusElement.getAttribute('aria-level')) ===
              currentFocusElementLevel + 1
          ) {
            nextFocusElementIndex = maybeNextFocusElementIndex;
          }
        }
      }

      if (evt.key === 'ArrowLeft') {
        evt.stopPropagation();

        if (currentFocusElement.getAttribute('aria-expanded') === 'true') {
          onExpandedChange(currentFocusElement.dataset.id as string, false);
        } else {
          const parentNode = findParentTreeItem(currentFocusElement);
          if (parentNode) {
            nextFocusElementIndex = nodes.indexOf(parentNode);
          }
        }
      }

      if (evt.key === '*') {
        evt.stopPropagation();

        for (const node of findAllNodesInSet(currentFocusElement)) {
          if (node.getAttribute('aria-expanded') === 'false') {
            onExpandedChange(node.dataset.id as string, true);
          }
        }
      }

      if (/^\p{Letter}$/u.test(evt.key)) {
        evt.stopPropagation();

        const letter = evt.key.toLocaleLowerCase();
        const maybeNode = nodes
          .slice(currentFocusElementIndex + 1)
          .find((node) =>
            node.textContent?.trim().toLocaleLowerCase().startsWith(letter)
          );

        if (maybeNode) {
          nextFocusElementIndex = nodes.indexOf(maybeNode);
        }
      }

      if (
        nextFocusElementIndex >= 0 &&
        nextFocusElementIndex < nodes.length &&
        nextFocusElementIndex !== currentFocusElementIndex
      ) {
        const nextFocusElement = nodes[nextFocusElementIndex];
        currentFocusElement.tabIndex = -1;
        nextFocusElement.tabIndex = 0;
        nextFocusElement.focus();
      }
    },
    [onExpandedChange]
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const nodes = findAllTreeItems(ref.current);
    const tabbable =
      ref.current.querySelector<HTMLElement>(tabbableSelector) ?? nodes[0];
    for (const node of nodes) {
      node.tabIndex = node === tabbable ? 0 : -1;
    }
  }, [tabbableSelector]);

  return { role: 'tree', ref, onKeyDown };
}

export function useTreeItem<T>({
  level,
  setSize,
  posInSet,
  isExpanded,
  onDefaultAction,
}: {
  level: number;
  setSize: number;
  posInSet: number;
  isExpanded?: boolean;
  onDefaultAction(evt: React.KeyboardEvent<T> | React.MouseEvent<T>): void;
}): React.HTMLAttributes<T> {
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
        // Only handle keyboard events if they originated on the treeitem
        // element
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

  return {
    onClick,
    onKeyDown,
    ['role']: 'treeitem',
    ['aria-level']: level,
    ['aria-setsize']: setSize,
    ['aria-posinset']: posInSet,
    ...(typeof isExpanded !== 'undefined' && { 'aria-expanded': isExpanded }),
  };
}
