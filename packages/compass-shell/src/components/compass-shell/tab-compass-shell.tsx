import { connect } from 'react-redux';
import React, { useCallback, useRef, useState } from 'react';
import { useTabState } from '@mongodb-js/compass-workspaces/provider';
import {
  Banner,
  Link,
  css,
  getScrollbarStyles,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';
import ShellInfoModal from '../shell-info-modal';
import ShellHeader from '../shell-header/shell-header';
import { usePreference } from 'compass-preferences-model/provider';
import { Shell } from '@mongosh/browser-repl';
import type { RootState } from '../../stores/store';
import { selectRuntimeById, saveHistory } from '../../stores/store';

const compassShellStyles = css(
  {
    backgroundColor: palette.gray.dark4,
    display: 'flex',
    flexBasis: 'auto',
    position: 'relative',
    flexDirection: 'column',
    width: '100vw',
  },
  getScrollbarStyles(true /* Always show dark mode. */)
);

const infoBannerContainerStyles = css({
  padding: spacing[400],
});

const compassShellContainerStyles = css({
  flexGrow: 1,
  display: 'flex',
  overflow: 'auto',
  borderTop: `1px solid ${palette.gray.dark2}`,
});

type ShellProps = React.ComponentProps<typeof Shell>;

type ShellRef = Extract<Required<ShellProps>['ref'], { current: any }>;

type ShellOutputEntry = Required<ShellProps>['initialOutput'][number];

type CompassShellProps = {
  runtime: WorkerRuntime | null;
  initialHistory: string[] | null;
  onHistoryChange: (history: string[]) => void;
};

const CompassShell: React.FC<CompassShellProps> = ({
  runtime,
  initialHistory,
  onHistoryChange,
}) => {
  const enableShell = usePreference('enableShell');
  const shellRef: ShellRef = useRef(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [shellOutput, setShellOutput] = useTabState<
    readonly ShellOutputEntry[]
  >('shellOutput', []);
  const [shellInput, setShellInput] = useTabState('shellInput', '');

  const showInfoModal = useCallback(() => {
    setInfoModalVisible(true);
  }, []);

  const hideInfoModal = useCallback(() => {
    setInfoModalVisible(false);
  }, []);

  const focusEditor = useCallback(() => {
    if (shellRef.current && window.getSelection()?.type !== 'Range') {
      shellRef.current.focusEditor();
    }
  }, [shellRef]);

  const updateShellOutput = useCallback(
    (output: readonly ShellOutputEntry[]) => {
      setShellOutput(output);
    },
    [setShellOutput]
  );

  const notifyOperationStarted = useCallback(() => {
    setIsOperationInProgress(true);
  }, []);

  const notifyOperationEnd = useCallback(() => {
    setIsOperationInProgress(false);
  }, []);

  if (!enableShell) {
    return (
      <div className={infoBannerContainerStyles}>
        <Banner variant="info">
          MongoDB Shell is disabled in your Settings. If this was not intended,
          we recommend you to review your{' '}
          <Link href="https://www.mongodb.com/docs/compass/current/settings/settings-reference/#interface-settings">
            settings
          </Link>{' '}
          and enable shell.
        </Banner>
      </div>
    );
  }

  if (!runtime || !initialHistory) {
    return <div className={compassShellStyles} />;
  }

  return (
    <>
      <ShellInfoModal show={infoModalVisible} hideInfoModal={hideInfoModal} />
      {/* Clicking on the shell container to focus it is a ux improvement to give
          the shell more of a native shell feeling. We disable the jsx-ally rules
          as this is a unique ux improvement solely for clicking. */}
      {/* eslint-disable jsx-a11y/no-static-element-interactions */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        data-testid="shell-section"
        className={compassShellStyles}
        id="content"
        onClick={focusEditor}
      >
        <ShellHeader
          isExpanded={true}
          isOperationInProgress={isOperationInProgress}
          showInfoModal={showInfoModal}
        />
        <div
          data-testid="shell-content"
          className={compassShellContainerStyles}
        >
          <Shell
            ref={shellRef}
            runtime={runtime}
            initialInput={shellInput}
            onInputChanged={setShellInput}
            initialOutput={shellOutput}
            onOutputChanged={updateShellOutput}
            initialHistory={initialHistory}
            onHistoryChanged={(history) => {
              onHistoryChange([...history]);
            }}
            onOperationStarted={notifyOperationStarted}
            onOperationEnd={notifyOperationEnd}
          />
        </div>
      </div>
    </>
  );
};

export default connect(
  (state: RootState) => {
    return {
      runtime: selectRuntimeById(state),
      initialHistory: state.history,
    };
  },
  { onHistoryChange: saveHistory }
)(CompassShell);
