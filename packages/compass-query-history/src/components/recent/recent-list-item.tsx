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
} from '@mongodb-js/compass-components';
import { Query } from '../query/query';
import type { QueryAttributes } from '../query/query';

type RecentModel = {
  _lastExecuted: {
    toString: () => string;
  };
  getAttributes: (arg0: { props: true }) => QueryAttributes;
};

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
      />
      <Button className={submitButtonStyles} type="submit" variant="primary">
        Save
      </Button>
      <Button type="button" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

type RecentListItemProps = {
  model: RecentModel;
  actions: {
    copyQuery: (model: RecentModel) => void;
    deleteRecent: (model: RecentModel) => void;
    runQuery: (attributes: QueryAttributes) => void;
    saveFavorite: (recent: RecentModel, name: string) => void;
    showFavorites: () => void;
  };
};

export default function RecentListItem({
  model,
  actions,
}: RecentListItemProps) {
  const [showSave, setShowSave] = useState(false);

  const saveRecent = () => {
    setShowSave(true);
  };

  const copyQuery = () => {
    actions.copyQuery(model);
  };

  const deleteRecent = () => {
    actions.deleteRecent(model);
  };

  const attributes = model.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key]);

  const runQuery = () => {
    actions.runQuery(attributes);
  };

  const saveFavorite = (name: string) => {
    actions.saveFavorite(model, name);
    setShowSave(false);
    actions.showFavorites();
  };

  const hideSaveFavorite = () => {
    setShowSave(false);
  };

  return (
    <Query
      title={model._lastExecuted.toString()}
      attributes={attributes}
      runQuery={runQuery}
      data-testid="recent-query-list-item"
      customHeading={
        showSave ? (
          <SaveForm saveFavorite={saveFavorite} onCancel={hideSaveFavorite} />
        ) : undefined
      }
    >
      <IconButton
        data-testid="query-history-button-fav"
        aria-label="Favorite Query"
        title="Favorite Query"
        onClick={saveRecent}
      >
        <Icon glyph="Favorite" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-copy-query"
        aria-label="Copy Query to Clipboard"
        title="Copy Query to Clipboard"
        onClick={copyQuery}
      >
        <Icon glyph="Copy" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-delete-fav"
        aria-label="Delete Query from Favorites List"
        title="Delete Query from Favorites List"
        onClick={deleteRecent}
      >
        <Icon glyph="Trash" />
      </IconButton>
    </Query>
  );
}
