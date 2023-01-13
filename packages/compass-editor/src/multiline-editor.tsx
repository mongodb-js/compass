import type { IconGlyph } from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import { css, spacing } from '@mongodb-js/compass-components';
import { Button, Icon } from '@mongodb-js/compass-components';
import type { Ace } from 'ace-builds';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { EditorProps as BaseEditorProps } from './base-editor';
import { BaseEditor } from './base-editor';

const actionButtonStyle = css({
  flex: 'none',
});

const actionButtonContentStyle = css({
  position: 'relative',
});

const actionButtonIconContainerStyle = css({
  opacity: 1,
  // leafygreen icon small size
  width: 14,
  height: 14,
  transition: 'opacity .2s linear',
});

const actionButtonIconContainerHiddenStyle = css({
  opacity: 0,
});

const actionButtonClickResultIconStyle = css({
  position: 'absolute',
  // leafygreen icon small size
  width: 14,
  height: 14,
  top: 0,
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity .2s linear',
});

const actionButtonClickResultIconHiddenStyle = css({
  opacity: 0,
});

const ActionButton: React.FunctionComponent<{
  icon: string | React.ReactNode;
  label: string;
  onClick: (
    ...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>
  ) => boolean | void;
}> = ({ label, icon, onClick }) => {
  const [clickResult, setClickResult] = useState<'success' | 'error'>(
    'success'
  );
  const [clickResultVisible, setClickResultVisible] = useState(false);

  const onButtonClick = useCallback(
    (...args: Parameters<React.MouseEventHandler<HTMLButtonElement>>) => {
      const result = onClick(...args);
      if (typeof result === 'boolean') {
        setClickResult(result ? 'success' : 'error');
        setClickResultVisible(true);
      }
    },
    [onClick]
  );

  useEffect(() => {
    if (!clickResultVisible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setClickResultVisible(false);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clickResultVisible]);

  return (
    <Button
      size="xsmall"
      aria-label={label}
      title={label}
      onClick={onButtonClick}
      className={actionButtonStyle}
    >
      <div className={actionButtonContentStyle}>
        <div
          className={cx(
            actionButtonIconContainerStyle,
            clickResultVisible && actionButtonIconContainerHiddenStyle
          )}
        >
          {typeof icon === 'string' ? (
            <Icon
              size="small"
              role="presentation"
              title={null}
              glyph={icon}
            ></Icon>
          ) : (
            icon
          )}
        </div>
        <div
          className={cx(
            actionButtonClickResultIconStyle,
            !clickResultVisible && actionButtonClickResultIconHiddenStyle
          )}
        >
          <Icon
            size="small"
            glyph={clickResult === 'success' ? 'Checkmark' : 'X'}
          ></Icon>
        </div>
      </div>
    </Button>
  );
};

type CustomActionItem = {
  icon: IconGlyph;
  action: string;
  label: string;
};

type EditorProps = Omit<BaseEditorProps, 'editorClassName'> & {
  copyable?: boolean;
  formattable?: boolean;
  customActions?: CustomActionItem[];
  onAction?: (editor: Ace.Editor | undefined, action: string) => void;
};

const FormatIcon = ({
  size = 16,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="currentColor"
      d="M2 4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H3Zm4-7a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Zm4 4a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1Z"
    />
  </svg>
);

const multilineEditorContainerStyle = css({
  position: 'relative',
  height: '100%',
  [`&:focus-within > .multiline-editor-actions,
    &:hover > .multiline-editor-actions`]: {
    display: 'flex',
  },
});

const editorContainerStyle = css({
  overflow: 'auto',
  // To account for the leafygreen button shadow on hover we add padding to the
  // top of the container that wraps the editor
  paddingTop: spacing[1],
  height: `calc(100% - ${spacing[1]}px)`,
  // We want folks to be able to click into the container element
  // they're using for the editor to focus the editor.
  minHeight: 'inherit',
});

const actionsContainerStyle = css({
  position: 'absolute',
  top: spacing[1],
  right: spacing[2],
  display: 'none',
  gap: spacing[2],
});

const MultilineEditor: React.FunctionComponent<EditorProps> = ({
  copyable = true,
  formattable = true,
  customActions = [],
  onAction,
  onLoad,
  className,
  ...props
}) => {
  const editorRef = useRef<Ace.Editor>();

  const actions = useMemo(() => {
    return [
      copyable && (
        <ActionButton
          label="Copy"
          icon="Copy"
          onClick={() => {
            editorRef.current?.execCommand('copy-all');
            return true;
          }}
        ></ActionButton>
      ),
      formattable && (
        <ActionButton
          label="Format"
          icon={
            <FormatIcon
              size={/* leafygreen small */ 14}
              role="presentation"
            ></FormatIcon>
          }
          onClick={() => {
            editorRef.current?.execCommand('prettify');
            return true;
          }}
        ></ActionButton>
      ),
      ...customActions.map((action) => {
        return (
          <ActionButton
            key={action.action}
            icon={action.icon}
            label={action.label}
            onClick={() => {
              onAction?.(editorRef.current, action.action);
            }}
          ></ActionButton>
        );
      }),
    ];
  }, [copyable, formattable, customActions, onAction]);

  return (
    <div className={cx(multilineEditorContainerStyle, className)}>
      {/* Separate scrollable container for editor so that action buttons can */}
      {/* stay in one place when scrolling */}
      <div className={editorContainerStyle}>
        <BaseEditor
          onLoad={(editor) => {
            editorRef.current = editor;
            onLoad?.(editor);
          }}
          {...props}
        ></BaseEditor>
      </div>
      {actions.length > 0 && (
        <div className={cx('multiline-editor-actions', actionsContainerStyle)}>
          {actions}
        </div>
      )}
    </div>
  );
};

export { MultilineEditor as Editor };
