import {
  Card,
  css,
  cx,
  Icon,
  ItemActionMenu,
  palette,
  spacing,
  Subtitle,
  useDarkMode,
  useFormattedDate,
} from '@mongodb-js/compass-components';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import React from 'react';

// Same as saved-queries-aggregations
export const CARD_WIDTH = spacing[1600] * 4;
export const CARD_HEIGHT = 180;

const diagramCardStyles = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const cardContentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'flex-end',
  gap: spacing[300],
});

const namespaceNameStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

const namespaceIconStyles = css({
  flexShrink: 0,
});

const lastModifiedLabel = css({
  fontStyle: 'italic',
});

const namespaceStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
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
  whiteSpace: 'nowrap',
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
  diagram: MongoDBDataModelDescription & {
    lastModified: number;
    databases: string;
  };
  onOpen: (diagram: MongoDBDataModelDescription) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const darkmode = useDarkMode();
  const formattedDate = useFormattedDate(diagram.lastModified);
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
      <div className={cardContentStyles}>
        <div className={namespaceStyles}>
          <Icon
            title={null}
            glyph="Database"
            color={palette.gray.dark1}
            className={namespaceIconStyles}
          ></Icon>
          <span className={namespaceNameStyles}>{diagram.databases}</span>
        </div>
        <div className={lastModifiedLabel}>
          Last&nbsp;modified: {formattedDate}
        </div>
      </div>
    </Card>
  );
}
