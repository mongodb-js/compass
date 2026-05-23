import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  css,
  spacing,
  palette,
  TextInput,
  IconButton,
  Icon,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { EditorRef, EditorSearchResult } from '@mongodb-js/compass-editor';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: spacing[100],
});

const inputStyles = css({
  flex: 1,
});

const counterStyles = css({
  flex: 'none',
  minWidth: spacing[1600],
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
});

const counterLightStyles = css({
  color: palette.gray.dark1,
});

const counterDarkStyles = css({
  color: palette.gray.light1,
});

const EMPTY_RESULT: EditorSearchResult = { count: 0, current: 0 };

export type UpdateDocumentFindRef = {
  /** Focuses and selects the find input (used for the Ctrl/Cmd+F shortcut). */
  focus: () => void;
};

export type UpdateDocumentFindProps = {
  editorRef: React.RefObject<EditorRef>;
};

function formatCounter(term: string, result: EditorSearchResult): string {
  if (!term) {
    return '';
  }
  if (result.count === 0) {
    return 'No results';
  }
  if (result.current > 0) {
    return `${result.current} of ${result.count}`;
  }
  return `${result.count} match${result.count === 1 ? '' : 'es'}`;
}

/**
 * Find-within-document bar, intentionally scoped to JSON mode only. Supports
 * the standard find shortcuts: Enter/Shift+Enter to navigate matches and
 * Escape to clear and blur.
 */
const UpdateDocumentFind = forwardRef<
  UpdateDocumentFindRef,
  UpdateDocumentFindProps
>(function UpdateDocumentFind({ editorRef }, ref) {
  const darkMode = useDarkMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<EditorSearchResult>(EMPTY_RESULT);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus();
        inputRef.current?.select();
      },
    }),
    []
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setTerm(value);
      if (!value) {
        editorRef.current?.clearSearch();
        setResult(EMPTY_RESULT);
        return;
      }
      setResult(editorRef.current?.find(value) ?? EMPTY_RESULT);
    },
    [editorRef]
  );

  const goNext = useCallback(() => {
    if (!term) {
      return;
    }
    setResult(editorRef.current?.findNext() ?? EMPTY_RESULT);
  }, [editorRef, term]);

  const goPrevious = useCallback(() => {
    if (!term) {
      return;
    }
    setResult(editorRef.current?.findPrevious() ?? EMPTY_RESULT);
  }, [editorRef, term]);

  const clear = useCallback(() => {
    editorRef.current?.clearSearch();
    setTerm('');
    setResult(EMPTY_RESULT);
    inputRef.current?.blur();
  }, [editorRef]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) {
          goPrevious();
        } else {
          goNext();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        // The surrounding LeafyGreen Modal closes on Escape via a native
        // document-level keydown listener (see @leafygreen-ui/hooks
        // useEscapeKey). Without stopping native propagation here, pressing
        // Escape to dismiss the find bar would also close the whole Edit
        // Document modal and discard the in-progress edit. A React-only
        // stopPropagation is not enough against a document listener, so we
        // stop the native event before it can bubble to document.
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        clear();
      }
    },
    [goNext, goPrevious, clear]
  );

  const hasMatches = result.count > 0;

  return (
    <div className={containerStyles} data-testid="update-document-find">
      <TextInput
        ref={inputRef}
        className={inputStyles}
        aria-label="Find in document"
        placeholder="Find"
        sizeVariant="small"
        value={term}
        onChange={onChange}
        onKeyDown={onKeyDown}
        data-testid="update-document-find-input"
      />
      <span
        className={
          darkMode
            ? `${counterStyles} ${counterDarkStyles}`
            : `${counterStyles} ${counterLightStyles}`
        }
        data-testid="update-document-find-counter"
      >
        {formatCounter(term, result)}
      </span>
      <IconButton
        aria-label="Previous match"
        disabled={!hasMatches}
        onClick={goPrevious}
        data-testid="update-document-find-previous"
      >
        <Icon glyph="ChevronUp" />
      </IconButton>
      <IconButton
        aria-label="Next match"
        disabled={!hasMatches}
        onClick={goNext}
        data-testid="update-document-find-next"
      >
        <Icon glyph="ChevronDown" />
      </IconButton>
    </div>
  );
});

export default UpdateDocumentFind;
