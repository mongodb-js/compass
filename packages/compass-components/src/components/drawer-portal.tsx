import React, { useContext, useEffect, useRef, useState } from 'react';

import {
  DrawerLayout,
  DisplayMode as DrawerDisplayMode,
  useDrawerToolbarContext,
  type DrawerLayoutProps,
} from './drawer';

type ToolbarData = Required<DrawerLayoutProps>['toolbarData'];

type DrawerStateContextValue = ToolbarData;

type DrawerActionsContextValue = {
  current: {
    openDrawer: (id: string) => void;
    closeDrawer: () => void;
    updateToolbarData: (data: ToolbarData[number]) => void;
  };
};

const DrawerStateContext = React.createContext<DrawerStateContextValue>([]);

const DrawerActionsContext = React.createContext<DrawerActionsContextValue>({
  current: {
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
    updateToolbarData: () => undefined,
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
  const [drawerState, setDrawerState] = useState<ToolbarData>([]);
  const drawerActions = useRef({
    openDrawer: () => undefined,
    closeDrawer: () => undefined,
    updateToolbarData: (data: ToolbarData[number]) => {
      setDrawerState((prevState) => {
        return prevState.map((item) => {
          return item.id === data.id ? data : item;
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
  return <>{children}</>;
};

/**
 * DrawerAnchor component will render the drawer in any place it is rendered.
 * This component has to wrap any content that Drawer will be shown near
 */
export const DrawerAnchor: React.FunctionComponent<{
  displayMode?: DrawerDisplayMode;
}> = ({ displayMode, children }) => {
  const toolbarData = useContext(DrawerStateContext);
  return (
    <DrawerLayout
      displayMode={displayMode ?? DrawerDisplayMode.Embedded}
      toolbarData={toolbarData}
    >
      <DrawerContextGrabber>{children}</DrawerContextGrabber>
    </DrawerLayout>
  );
};

type DrawerSectionProps = ToolbarData[number];

/**
 * DrawerSection allows to declaratively render sections inside the drawer
 * independantly from the Drawer itself
 */
export const DrawerSection: React.FunctionComponent<DrawerSectionProps> = ({
  children,
  ...props
}) => {
  const actions = useContext(DrawerActionsContext);
  useEffect(() => {
    actions.current.updateToolbarData({ ...props, content: children });
  });
  return null;
};

export { DrawerDisplayMode };
