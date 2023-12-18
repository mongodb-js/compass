import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import path from 'path';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { useDarkMode } from '../hooks/use-theme';

import {
  Button,
  Icon,
  IconButton,
  Label,
  Link,
  Description,
} from './leafygreen';

const { base: redBaseColor } = palette.red;

const containerStyles = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
  marginRight: 'auto',
  marginLeft: 'auto',
});

const formItemSmallStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

const formItemHorizontalStyles = css({
  display: 'flex',
});

const removeFileLineStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const removeFileButtonStyles = css({
  marginLeft: spacing[1],
});

const buttonSmallStyles = css({
  border: 'none',
  background: 'none',
  fontWeight: 'normal',
  marginLeft: spacing[2],

  '&:hover': {
    background: 'none',
    boxShadow: 'none',
  },
  '&:active': {
    background: 'none',
    boxShadow: 'none',
  },
});

const buttonDefaultStyles = css({
  // We !important here to override the LeafyGreen button width
  // that is applied after this.
  width: '100% !important',
});

const buttonTextStyle = css({
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  wordBreak: 'normal',
  whiteSpace: 'nowrap',
});

const errorMessageStyles = css({
  color: `${redBaseColor} !important`,
});

const labelHorizontalStyles = css({
  width: '90%',
  paddingRight: spacing[3],
});

const optionalLabelStyles = css({
  color: palette.gray.base,
  marginTop: spacing[1],
  fontStyle: 'italic',
  fontWeight: 'normal',
  fontSize: 12,
});

const infoLinkStyles = css({
  '&:link, &:active, &:hover': {
    textDecoration: 'none',
  },
});

const labelIconStyles = css({
  display: 'inline-block',
  verticalAlign: 'middle',
  fontSize: 'inherit',
  textRendering: 'auto',
  margin: '0 0 0 5px',
  cursor: 'pointer',
  color: palette.gray.light1,

  '&:link, &:active': {
    color: palette.gray.light1,
  },

  '&:link, &:active, &:hover': {
    textDecoration: 'none',
  },

  '&:hover': {
    color: palette.yellow.base,
  },
});

const disabledDescriptionLightStyles = css({
  color: palette.gray.dark1,
});

const disabledDescriptionDarkStyles = css({
  color: palette.gray.light1,
});

type FileInputVariant = 'default' | 'small' | 'vertical';

// https://www.electronjs.org/docs/latest/api/file-object
type FileWithPath = File & {
  /** Electron-specific property that contains an absolute path to the file */
  path: string;
};

// Matches Electron's file dialog options.
export type ElectronFileDialogOptions = {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
  buttonLabel?: string;
  properties?: string[];
};

type FileChooserOptions = {
  multi?: boolean;
  mode: 'open' | 'save';
  accept?: string;
} & ElectronFileDialogOptions;

// Allow alternate backends besides a HTML input, e.g.
// for writable file saving in Electron rather than read-only opening ("uploading").
// See createElectronFileInputBackend for a utility that allows this.
export type FileInputBackend = {
  // Called when the user indicates that they wish to select a file.
  openFileChooser: (options: FileChooserOptions) => void;
  // Should install a listener that is called when files have been selected.
  // Should return an unsubscribe function.
  onFilesChosen: (listener: (files: string[]) => void) => () => void;
};

export const FileInputBackendContext = createContext<
  (() => FileInputBackend) | null
>(null);

// This hook is to create a new instance of the file input
// backend provided by the context.
function useFileSystemBackend() {
  const fileInputBackendContext = useContext(FileInputBackendContext);

  const fileInputBackend = useRef<null | FileInputBackend>(
    fileInputBackendContext ? fileInputBackendContext() : null
  );

  return fileInputBackend.current;
}

// Matches require('electron') or require('@electron/remote')
export type ElectronShowFileDialogProvider<ElectronWindow> = {
  getCurrentWindow(): ElectronWindow;
  dialog: {
    showSaveDialog(
      window: ElectronWindow,
      options: Partial<ElectronFileDialogOptions>
    ): Promise<{ canceled: boolean; filePath?: string }>;
    showOpenDialog(
      window: ElectronWindow,
      options: Partial<ElectronFileDialogOptions>
    ): Promise<{ canceled: boolean; filePaths: string[] }>;
  };
};

export const FileInputBackendProvider: React.FunctionComponent<{
  createFileInputBackend: (() => FileInputBackend) | null;
}> = ({ children, createFileInputBackend }) => {
  const createFileInputBackendRef = useRef(createFileInputBackend);

  return (
    <FileInputBackendContext.Provider value={createFileInputBackendRef.current}>
      {children}
    </FileInputBackendContext.Provider>
  );
};

// Use as:
//
// import * as electronRemote from '@electron/remote';
// const backend = createElectronFileInputBackend(electronRemote);
// <FileInputBackendProvider createFileInputBackend={backend}>
//   <FileInput ... />
// <FileInputBackendProvider/>
export function createElectronFileInputBackend<ElectronWindow>(
  electron: ElectronShowFileDialogProvider<ElectronWindow>
): () => FileInputBackend {
  return () => {
    const listeners: ((files: string[]) => void)[] = [];

    return {
      openFileChooser(options: FileChooserOptions) {
        const window = electron.getCurrentWindow();

        let properties = [...(options.properties ?? [])];
        if (
          !properties.includes('openFile') &&
          !properties.includes('openDirectory')
        ) {
          properties.push('openFile');
        }
        if (options.multi) {
          if (!properties.includes('multiSelect')) {
            properties.push('multiSelect');
          }
        } else {
          properties = properties.filter((prop) => prop !== 'multiSelect');
        }

        const filters = [...(options.filters ?? [])];
        for (let acceptEntry of options.accept?.split(',') ?? []) {
          acceptEntry = acceptEntry.trim().toLowerCase();
          if (!acceptEntry.startsWith('.')) {
            continue; // A MIME type, not a file extension, so not something we know how to handle
          }
          const extension = acceptEntry.slice(1); // strip leading '.'
          if (
            !filters.some((filter) => filter.extensions.includes(extension))
          ) {
            filters.push({
              name: `${acceptEntry} file`,
              extensions: [extension],
            });
          }
        }

        electron.dialog[
          options.mode === 'open' ? 'showOpenDialog' : 'showSaveDialog'
        ](window, {
          properties,
          filters,
          ...(options.title ? { title: options.title } : {}),
          ...(options.defaultPath ? { defaultPath: options.defaultPath } : {}),
          ...(options.buttonLabel ? { buttonLabel: options.buttonLabel } : {}),
        })
          .then((result) => {
            const files = result.canceled
              ? []
              : 'filePaths' in result
              ? result.filePaths
              : result.filePath
              ? [result.filePath]
              : [];
            for (const listener of listeners) listener(files);
          })
          .catch(() => {
            /* ignore */
          });
      },
      onFilesChosen(listener) {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index !== -1) listeners.splice(index, 1);
        };
      },
    };
  };
}

function FileInput({
  autoOpen = false,
  id,
  label,
  dataTestId,
  onChange,
  disabled,
  optional = false,
  optionalMessage,
  error = false,
  errorMessage,
  variant = 'default',
  showFileOnNewLine = false,
  link,
  description,
  values,
  className,

  multi = false,
  mode = 'save',
  accept,
  title,
  defaultPath,
  filters,
  buttonLabel,
  properties,
}: {
  autoOpen?: boolean;
  id: string;
  label: string;
  dataTestId?: string;
  onChange: (files: string[]) => void;
  disabled?: boolean;
  optional?: boolean;
  optionalMessage?: string;
  error?: boolean;
  errorMessage?: string;
  variant?: FileInputVariant;
  link?: string;
  description?: string;
  showFileOnNewLine?: boolean;
  values?: string[];
  className?: string;
} & FileChooserOptions): React.ReactElement {
  const darkMode = useDarkMode();

  const inputRef = React.useRef<HTMLInputElement>(null);

  // To make components of Compass environment agnostic
  // (electron, browser, VSCode Webview), we use a backend context so that
  // the different environments can supply their own file system backends.
  const backend = useFileSystemBackend();

  const buttonText = React.useMemo(() => {
    if (Array.isArray(values) && values.length > 0) {
      return values.map((file) => path.basename(file)).join(', ');
    }

    return multi ? 'Select files...' : 'Select a file...';
  }, [values, multi]);

  const onFilesChanged = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(evt.currentTarget.files ?? []);
      const files = fileList.map((file) => {
        return (file as FileWithPath).path;
      });
      onChange(files);
    },
    [onChange]
  );

  const handleOpenFileInput = useCallback(() => {
    if (disabled) return;
    if (backend) {
      backend.openFileChooser({
        multi,
        mode,
        accept,
        title,
        defaultPath,
        filters,
        buttonLabel,
        properties,
      });
    } else if (inputRef.current) {
      inputRef.current.click();
    }
  }, [
    disabled,
    backend,
    multi,
    mode,
    accept,
    title,
    defaultPath,
    filters,
    buttonLabel,
    properties,
  ]);

  const initialAutoOpen = useRef(() => {
    if (autoOpen) {
      handleOpenFileInput();
    }
  });
  useEffect(() => {
    initialAutoOpen.current();
  }, []);

  useEffect(() => {
    return backend?.onFilesChosen?.(onChange);
  }, [backend, onChange]);

  const renderDescription = (): React.ReactElement | null => {
    if (!link && !description) {
      return null;
    }
    if (!link) {
      return (
        <Description data-testid={'file-input-description'}>
          {description}
        </Description>
      );
    }
    return (
      <Link
        data-testid={'file-input-link'}
        href={link}
        className={cx(description ? infoLinkStyles : labelIconStyles)}
        hideExternalIcon={!description}
      >
        {description ?? ''}
      </Link>
    );
  };

  const valuesAsString = useMemo(() => JSON.stringify(values), [values]);

  const leftGlyph =
    variant === 'small' ? undefined : (
      <Icon glyph="AddFile" title={null} fill="currentColor" />
    );
  const rightGlyph =
    variant === 'small' ? (
      <Icon glyph="Edit" title={null} fill="currentColor" />
    ) : undefined;

  return (
    <div className={cx(containerStyles, className)}>
      <div
        className={cx({
          [formItemSmallStyles]: variant === 'small',
          [formItemHorizontalStyles]: variant === 'default',
        })}
      >
        <div
          className={cx({
            [labelHorizontalStyles]: variant === 'default',
          })}
        >
          <Label htmlFor={`${id}_file_input`} disabled={disabled}>
            <span
              className={cx({
                [darkMode
                  ? disabledDescriptionDarkStyles
                  : disabledDescriptionLightStyles]: disabled,
              })}
            >
              {label}
            </span>
          </Label>
          {optional && (
            <div className={optionalLabelStyles}>
              {optionalMessage ? optionalMessage : 'Optional'}
            </div>
          )}
          {renderDescription()}
        </div>
        <input
          data-testid={dataTestId ?? 'file-input'}
          ref={inputRef}
          id={`${id}_file_input`}
          name={id}
          type="file"
          multiple={multi}
          onChange={onFilesChanged}
          style={{ display: 'none' }}
          // Force a re-render when the values change so
          // the component is controlled by the prop.
          // This is also useful for testing.
          key={valuesAsString}
          data-filenames={valuesAsString}
          accept={accept}
        />
        <Button
          id={id}
          data-testid="file-input-button"
          className={
            variant === 'small' ? buttonSmallStyles : buttonDefaultStyles
          }
          disabled={disabled}
          onClick={handleOpenFileInput}
          title="Select a file"
          leftGlyph={leftGlyph}
          rightGlyph={rightGlyph}
        >
          <span className={buttonTextStyle}>{buttonText}</span>
        </Button>
      </div>
      {showFileOnNewLine &&
        values &&
        values.length > 0 &&
        values.map((value, index) => (
          <div className={removeFileLineStyles} key={value}>
            <div>{value}</div>
            <IconButton
              className={removeFileButtonStyles}
              aria-label="Remove file"
              onClick={() => {
                const newValues = [...values];
                newValues.splice(index, 1);
                onChange(newValues);
              }}
            >
              <Icon glyph="X" />
            </IconButton>
          </div>
        ))}
      {error && errorMessage && (
        <Label
          data-testid={'file-input-error'}
          className={errorMessageStyles}
          htmlFor={''}
        >
          {errorMessage}
        </Label>
      )}
    </div>
  );
}

export default FileInput;
