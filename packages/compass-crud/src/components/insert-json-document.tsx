import React, { useMemo, useState } from 'react';
import { css, cx, palette, withDarkMode } from '@mongodb-js/compass-components';
import type { Annotation } from '@mongodb-js/compass-editor';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import queryParser, { toJSString } from 'mongodb-query-parser';
import { EJSON } from 'bson';
import { isDeepStrictEqual } from 'util';
import { replace } from 'lodash';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

type InsertJsonDocumentProps = {
  darkMode?: boolean;
  jsonDoc: string;
  isCommentNeeded: boolean;
  updateComment: (value: boolean) => void;
  updateJsonDoc: (value: string) => void;
};

const InsertJsonDocument: React.FunctionComponent<InsertJsonDocumentProps> = ({
  darkMode,
  jsonDoc,
  isCommentNeeded,
  updateJsonDoc,
}) => {
  const [prefix] = useState(() => {
    return isCommentNeeded ? `${EDITOR_COMMENT}` : '';
  });

  const onChangeText = (value: string) => {
    updateJsonDoc(value.split('*/\n').pop() ?? '');
  };

  const annotations = useMemo(() => {
    const annotations: Annotation[] = [];
    for (const match of jsonDoc.matchAll(
      /\$(oid|symbol|numberInt|numberLong|numberDouble|binary|code|timestamp|regularExpression|date|minKey|maxKey)\b/g
    )) {
      let { index } = match;
      const openingCurly = jsonDoc.lastIndexOf('{', index);
      if (openingCurly === -1) continue;
      index = openingCurly + 1;
      let openCurlies = 1;
      while (openCurlies > 0) {
        const nextClosingCurly = jsonDoc.indexOf('}', index);
        const nextOpeningCurly = jsonDoc.indexOf('{', index);
        if (nextClosingCurly === -1) {
          index = -1;
          break;
        }
        if (nextOpeningCurly === -1 || nextClosingCurly < nextOpeningCurly) {
          index = nextClosingCurly + 1;
          openCurlies--;
        } else {
          index = nextOpeningCurly + 1;
          openCurlies++;
        }
      }
      const closingCurly = index;
      const slice = jsonDoc.substring(openingCurly, closingCurly);
      let replacement: string;
      try {
        const parsed = queryParser(slice);
        replacement =
          toJSString(EJSON.deserialize(parsed, { relaxed: false })) ?? '';
      } catch {
        continue;
      }
      if (isDeepStrictEqual(queryParser(replacement ?? ''), slice)) {
        continue;
      }
      console.log({ slice, replacement });
      annotations.push({
        from: prefix.length + openingCurly,
        to: prefix.length + closingCurly,
        severity: 'warning',
        message: `EJSON tag ${match[0]} will be inserted into the database literally`,
        actions: [
          {
            name: 'Convert from EJSON',
            apply(view, from, to) {
              view.dispatch({
                changes: { from, to, insert: replacement },
              });
            },
          },
        ],
      });
    }
    return annotations;
  }, [jsonDoc, onChangeText]);

  return (
    <div
      className={cx(
        darkMode ? editorContainerStylesDark : editorContainerStylesLight
      )}
    >
      <CodemirrorMultilineEditor
        data-testid="insert-document-json-editor"
        text={prefix + jsonDoc}
        onChangeText={onChangeText}
        initialJSONFoldAll={false}
        minLines={18}
        annotations={annotations}
      />
    </div>
  );
};

export default withDarkMode(InsertJsonDocument);
