import React, { useState } from 'react';
import {
  IconButton,
  Icon,
  Button,
  TextInput,
  css,
  Label,
  useId,
  spacing,
  useFormattedDate,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import { Query } from './query';
import type { RootState } from '../modules/query-history';
import { copyQueryToClipboard } from '../utils/copy-query-to-clipboard';
import type { QueryModelType, QueryAttributes } from '../models/query';
import { deleteRecent, runRecentQuery } from '../modules/recent-queries';
import { saveFavorite } from '../modules/favorite-queries';

type SaveFormProps = {
  saveFavorite: (name: string) => void;
  onCancel: () => void;
};

const formStyles = css({
  display: 'flex',
});

const labelStyles = css({
  display: 'none',
});

const textInputStyles = css({
  flex: 1,
});

const submitButtonStyles = css({
  marginLeft: '6px', // spacing[1] makes the shadows overlap, spacing[2] is too much
  marginRight: spacing[1],
});

function SaveForm({ saveFavorite, onCancel }: SaveFormProps) {
  const [name, setName] = useState<string>('');
  const labelId = useId();
  const controlId = useId();
  return (
    <form
      className={formStyles}
      onSubmit={(event) => {
        event.preventDefault();
        saveFavorite(name);
      }}
    >
      <Label id={labelId} htmlFor={controlId} className={labelStyles} />
      <TextInput
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={true}
        placeholder="Favorite Name"
        className={textInputStyles}
        id={controlId}
        aria-labelledby={labelId}
        onChange={(event) => {
          setName(event.target.value);
        }}
        data-testid="recent-query-save-favorite-name"
      />
      <Button
        data-testid="recent-query-save-favorite-submit"
        className={submitButtonStyles}
        type="submit"
        variant="primary"
      >
        Save
      </Button>
      <Button
        data-testid="recent-query-save-favorite-cancel"
        type="button"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </form>
  );
}

type RecentListItemProps = {
  model: QueryModelType;
  runRecentQuery: (queryAttributes: QueryAttributes) => void;
  deleteRecent: (queryModel: QueryModelType) => void;
  saveFavorite: (recentQueryModel: QueryModelType, name: string) => void;
};

export function RecentListItem({
  runRecentQuery,
  deleteRecent,
  saveFavorite,
  model,
}: RecentListItemProps) {
  const [showSave, setShowSave] = useState(false);

  const attributes = model.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key as keyof typeof attributes]);

  // TODO: This used to be   const lastExecuted = useFormattedDate(model._lastExecuted.getTime()); even though it was a number.
  // Raw vs not raw in attributes ampersand
  const lastExecuted = useFormattedDate(
    (model._lastExecuted as Date).getTime?.()
  );

  return (
    <Query
      title={lastExecuted}
      attributes={attributes}
      onClickQuery={() => runRecentQuery(attributes)}
      data-testid="recent-query-list-item"
      customHeading={
        showSave ? (
          <SaveForm
            saveFavorite={(name: string) => saveFavorite(model, name)}
            onCancel={() => setShowSave(false)}
          />
        ) : undefined
      }
    >
      <IconButton
        data-testid="query-history-button-fav"
        aria-label="Favorite Query"
        title="Favorite Query"
        onClick={() => setShowSave(true)}
      >
        <Icon glyph="Favorite" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-copy-query"
        aria-label="Copy Query to Clipboard"
        title="Copy Query to Clipboard"
        onClick={() => copyQueryToClipboard(model)}
      >
        <Icon glyph="Copy" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-delete-recent"
        aria-label="Delete Query from Favorites List"
        title="Delete Query from Favorites List"
        onClick={() => deleteRecent(model)}
      >
        <Icon glyph="Trash" />
      </IconButton>
    </Query>
  );
}

export default connect(
  ({ queryHistory: { ns } }: RootState) => {
    return {
      namespace: ns,
    };
  },
  {
    deleteRecent,
    saveFavorite,
    runRecentQuery,
  }
)(RecentListItem);
