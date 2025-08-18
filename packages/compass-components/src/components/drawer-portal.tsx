import ReactDOM from 'react-dom';
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DrawerLayout,
  DisplayMode as DrawerDisplayMode,
  useDrawerToolbarContext,
  type DrawerLayoutProps,
} from './drawer';
import { css, cx } from '@leafygreen-ui/emotion';
import { isEqual } from 'lodash';
import { rafraf } from '../utils/rafraf';
import { palette } from '@leafygreen-ui/palette';

type SectionData = Required<DrawerLayoutProps>['toolbarData'][number];

type DrawerSectionProps = Omit<SectionData, 'content' | 'onClick'> & {
  /**
   * If `true` will automatically open the section when first mounted. Default: `false`
   */
  autoOpen?: boolean;
  /**
   * Allows to control item oder in the drawer toolbar, items without the order
   * provided will stay unordered at the bottom of the list
   */
  order?: number;
};

type DrawerActionsContextValue = {
  current: {
    openDrawer: (id: string) => void;
    closeDrawer: () => void;
    toggleDrawer: (id: string) => void;
    updateToolbarData: (data: DrawerSectionProps) => void;
    removeToolbarData: (id: string) => void;
  };
};

const DrawerStateContext = React.createContext<DrawerSectionProps[]>([]);

const DrawerActionsContext = React.createContext<DrawerActionsContextValue>({
  current: {
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
    toggleDrawer: () => undefined,
    updateToolbarData: () => undefined,
    removeToolbarData: () => undefined,
  },
});

/**
 * Drawer component that keeps track of drawer rendering state and provides
 * context to all places that require it. Separating it from DrawerAnchor and
 * DrawerSection allows to freely move the actual drawer around while allowing
 * the whole application access to the Drawer state, not only parts of it
 * wrapped in the Drawer
 *
 * @example
 *
 * function App() {
 *   return (
 *     <DrawerContentProvider>
 *       <DrawerAnchor>
 *         <Content></Content>
 *       </DrawerAnchor>
 *     </DrawerContentProvider>
 *   )
 * }
 *
 * function Content() {
 *   const [showDrawerSection, setShowDrawerSection] = useState(false);
 *   return (
 *     <>
 *       <button onClick={() => setShowDrawerSection(true)}></button>
 *       {showDrawerSection &&
 *         <DrawerSection id="section-1" title="Drawer Title">
 *           This will be rendered inside the drawer
 *         </>
 *       )}
 *     </>
 *   )
 * }
 */
export const DrawerContentProvider: React.FunctionComponent = ({
  children,
}) => {
  const [drawerState, setDrawerState] = useState<DrawerSectionProps[]>([]);
  const drawerActions = useRef({
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
    toggleDrawer: () => undefined,
    updateToolbarData: (data: DrawerSectionProps) => {
      setDrawerState((prevState) => {
        const itemIndex = prevState.findIndex((item) => {
          return item.id === data.id;
        });
        if (itemIndex === -1) {
          return [...prevState, data];
        }
        const newState = [...prevState];
        newState[itemIndex] = data;
        return newState;
      });
    },
    removeToolbarData: (id: string) => {
      setDrawerState((prevState) => {
        return prevState.filter((data) => {
          return data.id !== id;
        });
      });
    },
  });

  return (
    <DrawerStateContext.Provider value={drawerState}>
      <DrawerActionsContext.Provider value={drawerActions}>
        {children}
      </DrawerActionsContext.Provider>
    </DrawerStateContext.Provider>
  );
};

const DrawerContextGrabber: React.FunctionComponent = ({ children }) => {
  const drawerToolbarContext = useDrawerToolbarContext();
  const actions = useContext(DrawerActionsContext);
  actions.current.openDrawer = drawerToolbarContext.openDrawer;
  actions.current.closeDrawer = drawerToolbarContext.closeDrawer;
  actions.current.toggleDrawer = drawerToolbarContext.toggleDrawer;
  return <>{children}</>;
};

// Leafygreen Drawer gets right in the middle of our layout messing up most of
// the expectations for the workspace layouting. We override those to make them
// more flexible
const drawerLayoutFixesStyles = css({
  // content section
  '& > div:nth-child(1)': {
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'auto',
  },

  // drawer section
  '& > div:nth-child(2)': {
    marginTop: -1, // hiding the top border as we already have one in the place where the Anchor is currently rendered
    // Current animations assume a 42px sidebar but we hide it when there's no content
    // so we use a transtion instead of animations
    animation: 'none',
    transition: 'grid-template-columns 0.3s ease-in-out',
  },

  // We're stretching the title container to all available width so that we can
  // layout the controls there better. Doing our best to target the section
  // title here, leafygreen really doesn't give us anything else to try.
  //
  // TODO(ticket): This is obviously a horrible selector and we should make sure
  // that LG team provides a better one for us to achieve this behavior when
  // we're removing the vendored version of the drawer
  '& > div:nth-child(2) > div:nth-child(2) > div:first-child > div:first-child > div:first-child > div:first-child':
    {
      flex: 'none',
      width: 'calc(100% - 28px)', // disallow going over the title size (100 - close button width)
      overflow: 'hidden',
    },

  '& > div:nth-child(2):has([aria-hidden="false"])': {
    // Leafygreen currently has the sidebar width hardcoded to a width
    // but we also hide it when there's no content so we need auto
    gridTemplateColumns: 'auto 432px',
  },
  '& > div:nth-child(2):has(div[aria-hidden="true"])': {
    // Leafygreen currently has the sidebar width hardcoded to a width
    // but we also hide it when there's no content so we need auto
    gridTemplateColumns: 'auto 0px',
  },
});

const emptyDrawerLayoutFixesStyles = css({
  // Otherwise causes a weird content animation when the drawer becomes empty,
  // the only way not to have this oterwise is to always keep the drawer toolbar
  // on the screen and this eats up precious screen space
  transition: 'none',
  // Leafygreen removes areas when there are no drawer sections and this just
  // completely breaks the grid and messes up the layout
  gridTemplateAreas: '"content drawer"',
  // Bug in leafygreen where if `toolbarData` becomes empty while the drawer is
  // open, it never resets this value to the one that would allow drawer section
  // to collapse
  gridTemplateColumns: 'auto 0 !important',

  // template-columns 0 doesn't do anything if the content actually takes space,
  // so we override the values to hide the drawer toolbar when there's nothing
  // to show
  '& > div:nth-child(2)': {
    borderLeft: `1px solid ${palette.gray.light2}`,
    overflow: 'hidden',
  },

  '& > div:nth-child(2) > div:first-child': {
    width: '0px',
    border: 'none',
  },
});

const drawerSectionPortalStyles = css({
  minWidth: '100%',
  minHeight: '100%',
  height: '100%',
});

/**
 * DrawerAnchor component will render the drawer in any place it is rendered.
 * This component has to wrap any content that Drawer will be shown near
 */
export const DrawerAnchor: React.FunctionComponent<{
  displayMode?: DrawerDisplayMode;
}> = ({ displayMode, children }) => {
  const actions = useContext(DrawerActionsContext);
  const drawerSectionItems = useContext(DrawerStateContext);
  const prevDrawerSectionItems = useRef<DrawerSectionProps[]>([]);
  useEffect(() => {
    const prevIds = new Set(
      prevDrawerSectionItems.current.map((data) => {
        return data.id;
      })
    );
    for (const item of drawerSectionItems) {
      if (!prevIds.has(item.id) && item.autoOpen) {
        rafraf(() => {
          actions.current.openDrawer(item.id);
        });
      }
    }
    prevDrawerSectionItems.current = drawerSectionItems;
  }, [actions, drawerSectionItems]);
  const { toolbarData, hasVisibleToolbarItems } = useMemo(() => {
    const toolbarData = drawerSectionItems
      .map((data) => {
        return {
          ...data,
          content: (
            <div
              key={data.id}
              data-drawer-section={data.id}
              className={drawerSectionPortalStyles}
            ></div>
          ),
        };
      })
      .sort(({ order: orderA = Infinity }, { order: orderB = Infinity }) => {
        return orderB < orderA ? 1 : orderB > orderA ? -1 : 0;
      });
    return {
      toolbarData,
      hasVisibleToolbarItems: toolbarData.some((data) => data.glyph),
    };
  }, [drawerSectionItems]);
  return (
    <DrawerLayout
      displayMode={displayMode ?? DrawerDisplayMode.Embedded}
      toolbarData={toolbarData}
      className={cx(
        drawerLayoutFixesStyles,
        !hasVisibleToolbarItems && emptyDrawerLayoutFixesStyles,
        // classname is the only property leafygreen passes over to the drawer
        // wrapper component that would allow us to target it
        'compass-drawer-anchor'
      )}
    >
      <DrawerContextGrabber>{children}</DrawerContextGrabber>
    </DrawerLayout>
  );
};

/**
 * DrawerSection allows to declaratively render sections inside the drawer
 * independantly from the Drawer itself
 */
export const DrawerSection: React.FunctionComponent<DrawerSectionProps> = ({
  children,
  ...props
}) => {
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const actions = useContext(DrawerActionsContext);
  const prevProps = useRef<DrawerSectionProps>();
  useEffect(() => {
    if (!isEqual(prevProps.current, props)) {
      actions.current.updateToolbarData({ autoOpen: false, ...props });
      prevProps.current = props;
    }
  });
  useLayoutEffect(() => {
    const drawerEl = document.querySelector(
      '.compass-drawer-anchor > div:nth-child(2)'
    );
    if (!drawerEl) {
      throw new Error(
        'Can not use DrawerSection without DrawerAnchor being mounted on the page'
      );
    }
    setPortalNode(
      document.querySelector(`[data-drawer-section="${props.id}"]`)
    );
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes) as HTMLElement[]) {
          if (node.dataset && node.dataset.drawerSection === props.id) {
            setPortalNode(node);
          }
        }
      }
    });
    mutationObserver.observe(drawerEl, {
      subtree: true,
      childList: true,
    });
    return () => {
      mutationObserver.disconnect();
    };
  }, [actions, props.id]);
  useEffect(() => {
    return () => {
      actions.current.removeToolbarData(props.id);
    };
  }, [actions, props.id]);
  if (portalNode) {
    return ReactDOM.createPortal(children, portalNode);
  }
  return null;
};

export { DrawerDisplayMode };

export function useDrawerActions() {
  const actions = useContext(DrawerActionsContext);
  const stableActions = useRef({
    openDrawer: (id: string) => {
      actions.current.openDrawer(id);
    },
    closeDrawer: () => {
      actions.current.closeDrawer();
    },
    toggleDrawer: (id: string) => {
      actions.current.toggleDrawer(id);
    },
  });
  return stableActions.current;
}
