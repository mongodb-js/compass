import React, { useRef, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import type { EditorProps } from './editor';
import { Editor } from './editor';
import queryParser from 'mongodb-query-parser';
import { EJSON } from 'bson';
import { useElementParentHoverState } from '../utils/use-element-parent-hover-state';
import { Button } from './leafygreen';

type BSONValue = any;

type BSONDocumentEditorProps = Omit<EditorProps, 'variant'> & {
  variant?: never;
  onChangeValue?: (
    value: BSONValue,
    error: Error | null,
    variant: 'EJSON' | 'Shell',
    text: string,
    event?: any
  ) => void;
} & (
    | {
        initialValue?: never;
      }
    | {
        text?: never;
        initialValue?: BSONValue;
      }
  );

const actionsGroupContainer = css({
  position: 'absolute',
  display: 'flex',
  gap: spacing[2],
  width: '100%',
  top: spacing[3],
  right: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  pointerEvents: 'none',
  zIndex: 100,
});

const actionsGroupItem = css({
  flex: 'none',
  pointerEvents: 'all',
});

function BSONDocumentEditor({
  initialValue,
  onChangeValue,
  text,
  onChangeText,
  ...otherProps
}: BSONDocumentEditorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHovered = useElementParentHoverState(containerRef);

  if (!text && initialValue) {
    text = queryParser.toJSString(initialValue);
  }

  const [currentVariant, setCurrentVariant] = useState<'EJSON' | 'Shell'>(
    'Shell'
  );
  const [lastAlternateVariantRepr, setLastAlternateVariantRepr] = useState<{
    text: string;
    value: BSONValue;
  } | null>(null);
  const [currentText, setCurrentText] = useState(text ?? '');

  function onChangeTextWrapper(text: string, event?: any) {
    setCurrentText(text);
    onChangeText?.(text, event);
    if (onChangeValue) {
      let value;
      let error: Error | null = null;
      try {
        const parsed = queryParser(currentText);
        if (!parsed || typeof parsed !== 'object') {
          // XXX(COMPASS-5689): We've hit the condition in
          // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
          // in which instead of returning a parsed value or throwing an error,
          // the query parser just returns an empty string when encountering
          // input that can be parsed as JS but not as a valid query.
          // Unfortunately, this also means that all context around what
          // caused this error is unavailable here.
          throw new Error('Field contained invalid input');
        }

        if (currentVariant === 'Shell') {
          value = parsed;
        } else {
          value = EJSON.deserialize(parsed, { relaxed: false });
        }
      } catch (err) {
        error = err as Error;
      }
      onChangeValue(value, error, currentVariant, text, event);
    }
  }

  function onToggle() {
    const newVariant = currentVariant === 'Shell' ? 'EJSON' : 'Shell';
    setCurrentVariant(newVariant);
    try {
      let parsed = queryParser(currentText);
      if (currentVariant === 'EJSON') {
        parsed = EJSON.deserialize(parsed);
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error();
      }
      setLastAlternateVariantRepr({ text: currentText, value: parsed });

      if (
        EJSON.stringify(lastAlternateVariantRepr?.value, { relaxed: false }) ===
          EJSON.stringify(parsed, { relaxed: false }) &&
        lastAlternateVariantRepr?.text
      ) {
        setCurrentText(lastAlternateVariantRepr?.text);
        return;
      }

      if (newVariant === 'EJSON') {
        setCurrentText(queryParser.toJSString(EJSON.serialize(parsed)));
      } else {
        setCurrentText(queryParser.toJSString(parsed));
      }
    } catch {
      /* do not replace text if not easily possible */
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className={actionsGroupContainer}
        style={{
          display: isHovered ? 'flex' : 'none',
        }}
      >
        <span
          className={css({
            flex: '1 0 auto',
          })}
        ></span>
        <Button
          size="xsmall"
          title={
            currentVariant === 'EJSON'
              ? 'Switch to Shell BSON syntax'
              : 'Switch to Extended JSON syntax'
          }
          aria-label={
            currentVariant === 'EJSON'
              ? 'Switch to Shell BSON syntax'
              : 'Switch to Extended JSON syntax'
          }
          data-testid="toggle-ejson-shell-button"
          onClick={onToggle}
          className={actionsGroupItem}
        >
          {currentVariant === 'EJSON' ? '()' : '$'}
        </Button>
      </div>
      <Editor
        {...otherProps}
        variant={currentVariant}
        onChangeText={onChangeTextWrapper}
        text={currentText}
      />
    </div>
  );
}

export { BSONDocumentEditor, BSONDocumentEditorProps };
