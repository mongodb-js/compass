import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { css } from '@mongodb-js/compass-components';

// The composer anchors the command menu to the InputBar wrapper, which sits
// inside the bar's border and padding, so the menu would overlap the bar and
// start at the text instead of at the bar's edge. ComposerCommandMenu has no
// anchor/offset prop, so grow the wrapper out to the bar's left and right edges
// and up past its top by the menu gap. A transparent border (not padding)
// keeps the wrapper's padding box, and so the placeholder positioned inside
// it, where it was; the negative margins cancel the extra size so the text
// does not move.
const BAR_INSET = 'var(--via-space-300) + var(--via-border-width-025)';
// Via's popover already adds a 4px offset above its anchor, so this tops it up
// to the 8px the design has between the menu and the composer.
const MENU_GAP = 'var(--via-space-100)';
export const inputBarStyles = css({
  marginInline: `calc(-1 * (${BAR_INSET}))`,
  borderInline: `calc(${BAR_INSET}) solid transparent`,
  marginBlockStart: `calc(-1 * (${BAR_INSET} + ${MENU_GAP}))`,
  borderBlockStart: `calc(${BAR_INSET} + ${MENU_GAP}) solid transparent`,
});

// The menu popover is portaled, so it can't inherit the composer's width, and
// ComposerCommandMenu exposes no width prop. Instead we size the rows to the
// composer's width minus the menu's own border and the rows' inline padding
// (so the menu is as wide as the composer), and minus the scrollbar if the
// menu has a classic, non-overlay one, which the menu adds on top of the rows.
//
// Via renders rows through a collection that doesn't re-render when our render
// function changes, so those two measurements reach the rows as CSS variables
// on the menu instead of as state; that also keeps them current while the menu
// is open. `role="menu"` is the ARIA contract of the element the rows live in.
const MENU_WIDTH_VAR = '--skills-menu-width';
const MENU_GUTTER_VAR = '--skills-menu-gutter';
export const rowStyle = {
  inlineSize: `calc(var(${MENU_WIDTH_VAR}) - 2 * (var(--via-border-width-025) + var(--via-space-300)) - var(${MENU_GUTTER_VAR}, 0px))`,
};

export function useMenuSizing(containerRef: RefObject<HTMLElement>) {
  const observerRef = useRef<ResizeObserver | undefined>(undefined);
  useEffect(() => () => observerRef.current?.disconnect(), []);
  return useCallback(
    (element: HTMLElement | null) => {
      observerRef.current?.disconnect();
      const menu = element?.closest<HTMLElement>('[role="menu"]');
      const container = containerRef.current;
      if (!menu || !container) return;
      menu.style.scrollbarWidth = 'none';
      const update = () => {
        menu.style.setProperty(
          MENU_WIDTH_VAR,
          `${container.getBoundingClientRect().width}px`
        );

        const gutter =
          menu.offsetWidth - menu.clientWidth - 2 * menu.clientLeft;
        menu.style.setProperty(MENU_GUTTER_VAR, `${gutter}px`);
      };
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(menu);
      observerRef.current.observe(container);
      update();
    },
    [containerRef]
  );
}
