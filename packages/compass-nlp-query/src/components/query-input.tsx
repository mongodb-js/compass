import React, { useCallback } from 'react';
import { TextInput, css, spacing } from '@mongodb-js/compass-components';

const inputStyles = css({
  maxWidth: spacing[7] * 7.75
});

type QueryInputProps = {
  queryText: string;
  setQueryText: (text: string) => void;
};

function QueryInput({
  queryText,
  setQueryText
}: QueryInputProps): React.ReactElement {
  const onChangeQueryText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryText(e.target.value);
  }, [setQueryText]);

  return (
    <div>
      <TextInput
        className={inputStyles}
        value={queryText}
        onChange={onChangeQueryText}
        label="What would you like to know?"
        type="text"
        placeholder="Ask a question of your data; which documents have the Country either France or Spain?"
      />
    </div>
  );
}

export { QueryInput };
