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
} from '@leafygreen-ui/drawer';
import { css, cx } from '@leafygreen-ui/emotion';
import { isEqual } from 'lodash';
import { rafraf } from '../utils/rafraf';
import { GuideCue, type GuideCueProps } from './guide-cue/guide-cue';
import { BaseFontSize, fontWeights } from '@leafygreen-ui/tokens';

type ToolbarData = Required<DrawerLayoutProps>['toolbarData'];

type SectionData = ToolbarData[number];

type DrawerSectionProps = Omit<SectionData, 'content' | 'onClick'> & {
  // Title exists in DrawerLayoutProps, but is optional, whereas for us it needs
  // to be required (also due to merging of types inside leafygreen, we can't
  // convince typescript that our toolbarData is compatible with lg toolbarData
  // if that is not explicit)
  title: React.ReactNode;
  /**
   * If `true` will automatically open the section when first mounted. Default: `false`
   */
  autoOpen?: boolean;
  /**
   * Allows to control item oder in the drawer toolbar, items without the order
   * provided will stay unordered at the bottom of the list
   */
  order?: number;
  guideCue?: GuideCueProps<HTMLButtonElement>;
};

type DrawerOpenStateContextValue = boolean;

type DrawerSetOpenStateContextValue = (isOpen: boolean) => void;

type DrawerActionsContextValue = {
  current: {
    openDrawer: (id: string) => void;
    closeDrawer: () => void;
    updateToolbarData: (data: DrawerSectionProps) => void;
    removeToolbarData: (id: string) => void;
  };
};

const DrawerStateContext = React.createContext<DrawerSectionProps[]>([]);

const DrawerOpenStateContext =
  React.createContext<DrawerOpenStateContextValue>(false);

const DrawerSetOpenStateContext =
  React.createContext<DrawerSetOpenStateContextValue>(() => {});

type DrawerCurrentTabStateContextValue = string | null;

type DrawerSetCurrentTabContextValue = (currentTab: string | null) => void;

const DrawerCurrentTabStateContext =
  React.createContext<DrawerCurrentTabStateContextValue>(null);

const DrawerSetCurrentTabContext =
  React.createContext<DrawerSetCurrentTabContextValue>(() => {});

const DrawerActionsContext = React.createContext<DrawerActionsContextValue>({
  current: {
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
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
export const DrawerContentProvider: React.FunctionComponent<{
  onDrawerSectionOpen?: (drawerSectionId: string) => void;
  onDrawerSectionHide?: (drawerSectionId: string) => void;
  children?: React.ReactNode;
}> = ({ onDrawerSectionOpen, onDrawerSectionHide, children }) => {
  const [drawerState, setDrawerState] = useState<DrawerSectionProps[]>([]);
  const [drawerOpenState, setDrawerOpenState] =
    useState<DrawerOpenStateContextValue>(false);
  const [drawerCurrentTab, setDrawerCurrentTab] =
    useState<DrawerCurrentTabStateContextValue>(null);
  const drawerActions = useRef({
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
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

  const prevDrawerCurrentTabRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (drawerCurrentTab === prevDrawerCurrentTabRef.current) {
      // ignore unless it changed
      return;
    }

    if (drawerCurrentTab) {
      onDrawerSectionOpen?.(drawerCurrentTab);
    }

    if (prevDrawerCurrentTabRef.current) {
      onDrawerSectionHide?.(prevDrawerCurrentTabRef.current);
    }

    prevDrawerCurrentTabRef.current = drawerCurrentTab;
  }, [drawerCurrentTab, onDrawerSectionHide, onDrawerSectionOpen]);

  return (
    <DrawerStateContext.Provider value={drawerState}>
      <DrawerOpenStateContext.Provider value={drawerOpenState}>
        <DrawerSetOpenStateContext.Provider value={setDrawerOpenState}>
          <DrawerCurrentTabStateContext.Provider value={drawerCurrentTab}>
            <DrawerSetCurrentTabContext.Provider value={setDrawerCurrentTab}>
              <DrawerActionsContext.Provider value={drawerActions}>
                {children}
              </DrawerActionsContext.Provider>
            </DrawerSetCurrentTabContext.Provider>
          </DrawerCurrentTabStateContext.Provider>
        </DrawerSetOpenStateContext.Provider>
      </DrawerOpenStateContext.Provider>
    </DrawerStateContext.Provider>
  );
};

const DrawerContextGrabber: React.FunctionComponent = ({ children }) => {
  const drawerToolbarContext = useDrawerToolbarContext();
  const actions = useContext(DrawerActionsContext);
  const openStateSetter = useContext(DrawerSetOpenStateContext);
  const currentTabSetter = useContext(DrawerSetCurrentTabContext);
  actions.current.openDrawer = drawerToolbarContext.openDrawer;
  actions.current.closeDrawer = drawerToolbarContext.closeDrawer;

  useEffect(() => {
    openStateSetter(drawerToolbarContext.isDrawerOpen);
  }, [drawerToolbarContext.isDrawerOpen, openStateSetter]);

  useEffect(() => {
    const currentTab =
      drawerToolbarContext.getActiveDrawerContent()?.id ?? null;

    currentTabSetter(currentTab);
  }, [drawerToolbarContext, currentTabSetter]);

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
  '& > div:nth-child(2) > div': {
    // hiding the border border as we already have one in the place where the
    // Anchor is currently rendered
    borderTop: 'none',
    borderBottom: 'none',
  },

  // drawer content > title content
  '& > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:first-child > div:first-child > div:first-child':
    {
      // fix for the flex parent not allowing flex children to collapse if they
      // are overflowing the container
      minWidth: 0,
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
    width: '0 !important',
    overflow: 'hidden',
  },
});

const drawerSectionPortalStyles = css({
  minWidth: '100%',
  minHeight: '100%',
  height: '100%',
});

// Leafygreen dynamically changes styles of the title group based on whether or
// not title is a `string` or a `ReactNode`, we want it to consistently have
// bold title styles no matter what title you provided, so we wrap it in our own
// container
const drawerTitleGroupStyles = css({
  width: '100%',
  fontSize: BaseFontSize.Body2,
  fontWeight: fontWeights.bold,
});

/**
 * DrawerAnchor component will render the drawer in any place it is rendered.
 * This component has to wrap any content that Drawer will be shown near
 */
export const DrawerAnchor: React.FunctionComponent = ({ children }) => {
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
  const toolbarData = useMemo(() => {
    return drawerSectionItems
      .map((data) => {
        return {
          hasPadding: false,
          ...data,
          title: (
            <div key={data.id} className={drawerTitleGroupStyles}>
              {data.title}
            </div>
          ),
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
  }, [drawerSectionItems]);

  const [toolbarIconNodes, setToolbarIconNodes] = useState<
    Record<string, HTMLButtonElement | undefined>
  >({});

  useLayoutEffect(
    function () {
      const drawerEl = document.querySelector('.compass-drawer-anchor');
      if (!drawerEl) {
        throw new Error(
          'Can not use DrawerSection without DrawerAnchor being mounted on the page'
        );
      }

      function check() {
        if (!drawerEl) {
          return;
        }
        const nodes: Record<string, HTMLButtonElement | undefined> = {};
        for (const item of toolbarData) {
          if (!item.guideCue) {
            continue;
          }

          const button = drawerEl.querySelector<HTMLButtonElement>(
            `button[aria-label="${item.label}"]`
          );
          if (button) {
            nodes[item.id] = button;
          }
        }

        setToolbarIconNodes((oldNodes) => {
          // account for removed nodes by checking all keys of both old and new
          for (const id of Object.keys({ ...oldNodes, ...nodes })) {
            if (nodes[id] !== oldNodes[id]) {
              return nodes;
            }
          }
          return oldNodes;
        });
      }
      check();

      const mutationObserver = new MutationObserver(() => {
        check();
      });

      // use a mutation observer because at least in unit tests the button
      // elements don't exist immediately
      mutationObserver.observe(drawerEl, {
        subtree: true,
        childList: true,
      });
      return () => {
        mutationObserver.disconnect();
      };
    },
    [toolbarData]
  );

  return (
    <>
      {toolbarData.map((item) => {
        return (
          toolbarIconNodes[item.id] &&
          item.guideCue && (
            <GuideCue<HTMLButtonElement>
              key={item.id}
              {...item.guideCue}
              triggerNode={toolbarIconNodes[item.id]}
            />
          )
        );
      })}
      <DrawerLayout
        displayMode={DrawerDisplayMode.Embedded}
        resizable
        toolbarData={toolbarData}
        className={cx(
          drawerLayoutFixesStyles,
          toolbarData.length === 0 && emptyDrawerLayoutFixesStyles,
          // classname is the only property leafygreen passes over to the drawer
          // wrapper component that would allow us to target it
          'compass-drawer-anchor'
        )}
      >
        <DrawerContextGrabber>{children}</DrawerContextGrabber>
      </DrawerLayout>
    </>
  );
};

function querySectionPortal(
  parent: Document | Element | null,
  id?: string
): HTMLElement | null {
  return (
    parent?.querySelector(`[data-drawer-section${id ? `=${id}` : ''}]`) ?? null
  );
}

/**
 * DrawerSection allows to declaratively render sections inside the drawer
 * independantly from the Drawer itself
 */
export const DrawerSection: React.FunctionComponent<DrawerSectionProps> = ({
  children,
  ...props
}) => {
  const [portalNode, setPortalNode] = useState<Element | null>(() => {
    return querySectionPortal(document, props.id);
  });
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
    setPortalNode(querySectionPortal(drawerEl, props.id));
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.addedNodes)) {
            // Added node can be either the drawer section portal itself, a
            // parent node containing the section (in that case we won't get an
            // explicit mutation for the section itself), or something
            // completely unrelated, like a text node insert. By searching for
            // the section portal from added node parent element we cover all
            // these cases in one go
            const drawerSectionNode = querySectionPortal(
              node.parentElement,
              props.id
            );
            if (drawerSectionNode) {
              setPortalNode(drawerSectionNode);
            }
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
  }, [props.id]);
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
      rafraf(() => {
        actions.current.openDrawer(id);
      });
    },
    closeDrawer: () => {
      actions.current.closeDrawer();
    },
  });
  return stableActions.current;
}

export const useDrawerState = () => {
  const drawerOpenStateContext = useContext(DrawerOpenStateContext);
  const drawerState = useContext(DrawerStateContext);
  return {
    isDrawerOpen:
      drawerOpenStateContext &&
      // the second check is a workaround, because LG doesn't set isDrawerOpen to false when it's empty
      drawerState.length > 0,
  };
};

export { getLgIds as getDrawerIds } from '@leafygreen-ui/drawer';
