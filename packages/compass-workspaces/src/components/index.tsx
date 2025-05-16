import React, { useEffect, useRef } from 'react';
import {
  css,
  cx,
  palette,
  ResizableSidebar,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { CollectionTabInfo } from '../stores/workspaces';
import {
  closeSidebarChat,
  getActiveTab,
  openSidebarChat,
  type OpenWorkspaceOptions,
  type WorkspaceTab,
  type WorkspacesState,
} from '../stores/workspaces';
import Workspaces from './workspaces';
import { connect } from '../stores/context';
import { WorkspacesServiceProvider } from '../provider';

type WorkspacesWithSidebarProps = {
  /**
   * Current active workspace tab
   */
  activeTab: WorkspaceTab | null;
  /**
   * Collection info for the current active tab namespace (`null` if not fetched
   * yet or active tab is not of type Collection)
   */
  activeTabCollectionInfo: CollectionTabInfo | null;
  /**
   * Callback prop called when current active tab changes or collectionInfo for
   * the active tab changes (in case of Collection workspace)
   * @param ws current active workspace
   * @param collectionInfo active workspaces collection info
   */
  onActiveWorkspaceTabChange<WS extends WorkspaceTab>(
    ws: WS | null,
    collectionInfo: WS extends { type: 'Collection' }
      ? CollectionTabInfo | null
      : never
  ): void;
  /**
   * Initial workspace tab to show (by default no tabs will be shown initially)
   */
  initialWorkspaceTabs?: OpenWorkspaceOptions[] | null;
  /**
   * Workspace configuration to be opened when all tabs are closed (defaults to
   * "My Queries")
   */
  openOnEmptyWorkspace?: OpenWorkspaceOptions | null;
  /**
   * Workspaces sidebar component slot Required so that plugin modals can be
   * rendered inside workspace React tree and access workspace state and actions
   * from service locator context
   */
  renderSidebar?: () => React.ReactElement | null;
  /**
   * Chat sidebar component slot. Required so that the plugins can be rendered
   * inside workspace React tree and access workspace state and actions from
   * service locator context.
   */
  renderChatSidebar?: ({
    isOpen,
    setOpen,
  }: {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  }) => React.ReactElement | null;
  /**
   * Workspaces plugin modals components slot. Required so that plugin modals
   * can be rendered inside workspace React tree and access workspace state and
   * actions from service locator context
   */
  renderModals?: () => React.ReactElement | null;

  setOpenSidebarChat: (isOpen: boolean) => void;
  isSidebarChatOpen: boolean;
};

const containerLightThemeStyles = css({
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const containerDarkThemeStyles = css({
  backgroundColor: palette.black,
  color: palette.white,
});

const horizontalDoubleSplitStyles = css({
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateColumns: 'min-content auto',
  minHeight: 0,
});

const horizontalTripleSplitStyles = css({
  width: '100%',
  height: '100%',
  display: 'grid',
  // gridTemplateColumns: 'min-content auto min-content', // left sidebar, main, right sidebar
  // gridTemplateColumns: 'min-content auto auto', // left sidebar, main, right sidebar
  // gridTemplateColumns: 'min-content auto min-content', // left sidebar, main, right sidebar
  // gridTemplateColumns: 'min-content auto 298px', // left sidebar, main, right sidebar
  // gridTemplateColumns: 'min-content auto 438px', // left sidebar, main, right sidebar
  gridTemplateColumns: 'min-content auto 498px', // left sidebar, main, right sidebar
  minHeight: 0,
});

const workspacesStyles = css({
  // minHeight: 0,
  // overflow: 'hidden',
  // minWidth: '750px', // roughly the minimum needed for the CRUD toolbars
  width: '100%',
  height: '100%',
  display: 'flex',

  overflow: 'auto',
  // position: 'absolute',
  // top: 0,
  // left: 0,
  // right: 0,
  // bottom: 0,
});

const workspacesContainerStyles = css({
  // initial sidebar width + something for the right part, should be the min though
  // and set this max width based on the available space
  // TODO: This doesn't actually do anything at the moment.
  // maxWidth: 'calc(100vw - 340px)',
  // maxWidth: 'calc(100vw - 340px)',
  // See 340px in the ResizableSidebar component.
});

const sidebarStyles = css({
  minHeight: 0,
});

// const chatSidebarStyles = css({
//   minHeight: 0,
//   minWidth: '200px', // Random number.
//   minWidth: 0
// })

// Note: This is assuming the left sidebar isn't changing size, which isn't right.
const initialLeftSidebarWidth = 300;
// const initialRightSidebarWidth = 100;
const initialRightSidebarWidth = 0;

const WorkspacesWithSidebar: React.FunctionComponent<
  WorkspacesWithSidebarProps
> = ({
  activeTab,
  activeTabCollectionInfo,
  openOnEmptyWorkspace,
  onActiveWorkspaceTabChange,
  renderSidebar,
  renderChatSidebar,
  renderModals,

  setOpenSidebarChat,
  isSidebarChatOpen,
}) => {
  // const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  const darkMode = useDarkMode();
  const onChange = useRef(onActiveWorkspaceTabChange);
  onChange.current = onActiveWorkspaceTabChange;
  useEffect(() => {
    onChange.current(activeTab, activeTabCollectionInfo);
  }, [activeTab, activeTabCollectionInfo]);
  return (
    <WorkspacesServiceProvider>
      <div
        className={cx(
          isSidebarChatOpen && horizontalTripleSplitStyles,
          !isSidebarChatOpen && horizontalDoubleSplitStyles,
          darkMode ? containerDarkThemeStyles : containerLightThemeStyles
        )}
      >
        <div className={sidebarStyles}>{renderSidebar?.()}</div>
        {/* <div className={workspacesContainerStyles}> */}

        {/* LG chat is always 298 px, so we're avoiding resize for now, also not needed for POC */}

        {/* <ResizableSidebar
          data-testid="workspaces-sidebar"
          useNewTheme={true}
          // initialWidth={window.screen.width - initialLeftSidebarWidth - initialRightSidebarWidth}
          initialWidth={window.screen.width - initialLeftSidebarWidth}
          minWidth={700}
          hackyOverrideWidth={isSidebarChatOpen}
          disabled={!isSidebarChatOpen}
          // TODO: This should be screen width - both sidebar sizes.
          // Probably to be done in the ResizableSidebar component somehow.
          maxWidth={Infinity}
        > */}
        <div className={workspacesStyles}>
          <Workspaces openOnEmptyWorkspace={openOnEmptyWorkspace}></Workspaces>
        </div>
        {/* </ResizableSidebar> */}
        {/* </div> */}
        {/* <div className={chatSidebarStyles}> */}
        {renderChatSidebar?.({
          isOpen: isSidebarChatOpen,
          setOpen: setOpenSidebarChat,
        })}
        {/* </div> */}
      </div>
      {renderModals?.()}
    </WorkspacesServiceProvider>
  );
};

export default connect(
  (state: WorkspacesState) => {
    const activeTab = getActiveTab(state);
    return {
      activeTab,
      isSidebarChatOpen: state.isSidebarChatOpen,
      activeTabCollectionInfo:
        activeTab?.type === 'Collection'
          ? state.collectionInfo[activeTab.namespace]
          : null,
    };
  },
  {
    setOpenSidebarChat: (isOpen: boolean) =>
      isOpen ? openSidebarChat() : closeSidebarChat(),
  }
)(WorkspacesWithSidebar);
