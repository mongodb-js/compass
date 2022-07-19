import React, { useCallback, useRef } from 'react';
import {
  css,
  spacing,
  TextArea,
  Button,
  Icon,
  IconButton,
  MongoDBLogoMark,
} from '@mongodb-js/compass-components';
import { LeafyListener } from '../util/microphone';

const inputAreaContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
  flexGrow: 1,
});

const inputStyles = css({
  maxWidth: spacing[7] * 7.8,
  flexGrow: 1,
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

  const leafyListener = useRef(new LeafyListener());

  const onClickButton = useCallback(() => {
    // Starts it
    leafyListener.current.start();
    console.log('we are listening');

    // TODO: Cleanup or auto stop.
    setTimeout(() => {
      leafyListener.current.stop();
      console.log('stopped listening');


    }, 5000);
  }, []);

  return (
    <div className={inputAreaContainerStyles}>
      <TextArea
        className={inputStyles}
        value={queryText}
        onChange={onChangeQueryText}
        onKeyDown={onKeyDown}
        label="What would you like to know?"
        placeholder="Ask a question of your data; which documents have the Country either France or Spain?"
      />

      <IconButton
        onClick={onClickButton}
        // type="button"
        aria-label="Voice command"
      >
        <MongoDBLogoMark
          height={spacing[4]}
        />
        {/* <Icon glyph="" /> */}

      </IconButton>
      {/* TODO: Pull in document schema, use badges (maybe as buttons?) to
       * show the field names (and highlight name already inputted? */}
    </div>
  );
}

export { QueryInput };
