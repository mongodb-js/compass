import { connect } from 'react-redux';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useOnTabReplace,
  useTabState,
} from '@mongodb-js/compass-workspaces/provider';
import type { EditorRef } from '@mongodb-js/compass-editor';
import {
  Banner,
  Link,
  css,
  getScrollbarStyles,
  palette,
  rafraf,
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

type ShellOutputEntry = Required<ShellProps>['output'][number];

type CompassShellProps = {
  runtime: WorkerRuntime | null;
  initialHistory: string[] | null;
  onHistoryChange: (history: string[]) => void;
  initialEvaluate?: string | string[];
  initialInput?: string;
};

function useInitialEval(
  initialEvaluate: string | string[] | undefined,
  isRender: boolean
) {
  const [initialEvalApplied, setInitialEvalApplied] = useTabState(
    'initialEvalApplied',
    false
  );
  useEffect(() => {
    // as soon as we render the first time, set it to true
    if (isRender && !initialEvalApplied) {
      setInitialEvalApplied(true);
    }
  }, [initialEvalApplied, setInitialEvalApplied, isRender]);
  return initialEvalApplied ? undefined : initialEvaluate;
}

export const CompassShell: React.FC<CompassShellProps> = ({
  runtime,
  initialHistory,
  onHistoryChange,
  initialEvaluate: _initialEvaluate,
  initialInput,
}) => {
  const enableShell = usePreference('enableShell');
  const canRenderShell = !!(enableShell && initialHistory && runtime);

  // initialEvaluate will only be set on the first render of the browser-repl
  // component
  const initialEvaluate = useInitialEval(_initialEvaluate, canRenderShell);

  const editorRef = useRef<EditorRef>(null);

  const [isOperationInProgress, setIsOperationInProgress] = useTabState(
    'isOperationInProgress',
    false
  );

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [shellOutput, setShellOutput] = useTabState<ShellOutputEntry[]>(
    'shellOutput',
    []
  );
  const [shellInput, setShellInput] = useTabState(
    'shellInput',
    initialInput ?? ''
  );

  useOnTabReplace(() => {
    // Never allow to replace the shell tab to avoid destroying the runtime
    // unnecessarily
    return false;
  });

  const showInfoModal = useCallback(() => {
    setInfoModalVisible(true);
  }, []);

  const hideInfoModal = useCallback(() => {
    setInfoModalVisible(false);
  }, []);

  const focusEditor = useCallback(() => {
    if (editorRef.current && window.getSelection()?.type !== 'Range') {
      editorRef.current.focus();
    }
  }, []);

  const onOperationStarted = useCallback(() => {
    setIsOperationInProgress(true);
  }, [setIsOperationInProgress]);

  const onOperationEnd = useCallback(() => {
    setIsOperationInProgress(false);
  }, [setIsOperationInProgress]);

  useEffect(() => {
    if (canRenderShell) {
      return rafraf(() => {
        editorRef.current?.focus();
      });
    }
  }, [canRenderShell]);

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

  if (!canRenderShell) {
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
            runtime={runtime}
            maxOutputLength={1000}
            maxHistoryLength={1000}
            initialEvaluate={initialEvaluate}
            initialText={shellInput}
            onInputChanged={setShellInput}
            output={shellOutput}
            onOutputChanged={setShellOutput}
            history={initialHistory}
            onHistoryChanged={onHistoryChange}
            onOperationStarted={onOperationStarted}
            onOperationEnd={onOperationEnd}
            isOperationInProgress={isOperationInProgress}
            ref={editorRef}
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
