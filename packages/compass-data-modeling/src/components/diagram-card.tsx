import {
  Card,
  css,
  cx,
  ItemActionMenu,
  palette,
  spacing,
  Subtitle,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import React from 'react';

// Same as saved-queries-aggregations
export const CARD_WIDTH = spacing[1600] * 4;
export const CARD_HEIGHT = 218;

const diagramCardStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const cardHeaderStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'flex-start',
});
const cardTitle = css({
  fontWeight: 'bold',
  height: spacing[600] * 2,
  marginBottom: spacing[400],

  // WebkitLineClamp css property is in a very weird state in the spec and
  // requires using deprecated flexbox spec props, but this does work in
  // (Chromium) Electron and is the only way to get multiline text overflow to
  // work using CSS only
  //
  // See: https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

const cardTitleDark = css({
  color: palette.green.light2,
});
const cardTitleLight = css({
  color: palette.green.dark2,
});

export function DiagramCard({
  diagram,
  onOpen,
  onRename,
  onDelete,
}: {
  diagram: MongoDBDataModelDescription;
  onOpen: (diagram: MongoDBDataModelDescription) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const darkmode = useDarkMode();
  return (
    <Card
      className={diagramCardStyles}
      contentStyle="clickable"
      onClick={() => onOpen(diagram)}
      data-testid="saved-diagram-card"
      data-diagram-name={diagram.name}
      title={diagram.name}
    >
      <div className={cardHeaderStyles}>
        <Subtitle
          as="div"
          className={cx(cardTitle, darkmode ? cardTitleDark : cardTitleLight)}
          title={diagram.name}
        >
          {diagram.name}
        </Subtitle>
        <ItemActionMenu
          isVisible
          actions={[
            { action: 'rename', label: 'Rename' },
            { action: 'delete', label: 'Delete' },
          ]}
          onAction={(action) => {
            switch (action) {
              case 'rename':
                onRename(diagram.id);
                break;
              case 'delete':
                onDelete(diagram.id);
                break;
              default:
                break;
            }
          }}
        ></ItemActionMenu>
      </div>
    </Card>
  );
}
