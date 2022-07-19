import React, { useCallback } from 'react';
import {
  TextInput,
  css,
  spacing,
  TextArea,
} from '@mongodb-js/compass-components';

const inputStyles = css({
  maxWidth: spacing[7] * 7.8,
});

type QueryInputProps = {
  queryText: string;
  onTranslateQuery: () => Promise<void>;
  setQueryText: (text: string) => void;
};

function QueryInput({
  queryText,
  onTranslateQuery,
  setQueryText,
}: QueryInputProps): React.ReactElement {
  const onChangeQueryText = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setQueryText(e.target.value);
    },
    [setQueryText]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        void onTranslateQuery();
        event.preventDefault();
      }
    },
    [onTranslateQuery]
  );

  return (
    <div>
      {/* <TextInput
        className={inputStyles}
        value={queryText}
        onChange={onChangeQueryText}
        onKeyDown={onKeyDown}
        label="What would you like to know?"
        type="text"
        placeholder="Ask a question of your data; which documents have the Country either France or Spain?"
      /> */}

      <TextArea
        className={inputStyles}
        value={queryText}
        onChange={onChangeQueryText}
        onKeyDown={onKeyDown}
        label="What would you like to know?"
        // type="text"
        placeholder="Ask a question of your data; which documents have the Country either France or Spain?"
      />
      {/* TODO: Pull in document schema, use badges (maybe as buttons?) to
       * show the field names (and highlight name already inputted? */}
    </div>
  );
}

export { QueryInput };
