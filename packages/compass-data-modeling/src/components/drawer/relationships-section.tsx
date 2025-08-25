import React from 'react';
import { DMDrawerSection } from './drawer-section-components';
import {
  Badge,
  Button,
  css,
  Icon,
  IconButton,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { Relationship } from '../../services/data-model-storage';
import { getDefaultRelationshipName } from '../../utils';

const titleBtnStyles = css({
  marginLeft: 'auto',
  maxHeight: 20, // To match accordion line height
});

const emptyRelationshipMessageStyles = css({
  color: palette.gray.dark1,
});

const relationshipsListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const relationshipItemStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const relationshipNameStyles = css({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
  paddingRight: spacing[200],
});

const relationshipContentStyles = css({
  marginTop: spacing[400],
});

type RelationshipsSectionProps = {
  relationships: Relationship[];
  emptyMessage: string;
  onCreateNewRelationshipClick: () => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
};

export const RelationshipsSection: React.FunctionComponent<
  RelationshipsSectionProps
> = ({
  relationships,
  emptyMessage,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
}) => {
  return (
    <DMDrawerSection
      label={
        <>
          Relationships&nbsp;
          <Badge>{relationships.length}</Badge>
          <Button
            className={titleBtnStyles}
            size="xsmall"
            onClick={onCreateNewRelationshipClick}
          >
            Add relationship
          </Button>
        </>
      }
    >
      <div className={relationshipContentStyles}>
        {!relationships.length ? (
          <div className={emptyRelationshipMessageStyles}>{emptyMessage}</div>
        ) : (
          <ul className={relationshipsListStyles}>
            {relationships.map((r) => {
              const relationshipLabel = getDefaultRelationshipName(
                r.relationship
              );

              return (
                <li
                  key={r.id}
                  data-relationship-id={r.id}
                  className={relationshipItemStyles}
                >
                  <span
                    className={relationshipNameStyles}
                    title={relationshipLabel}
                  >
                    {relationshipLabel}
                  </span>
                  <IconButton
                    aria-label="Edit relationship"
                    title="Edit relationship"
                    onClick={() => {
                      onEditRelationshipClick(r.id);
                    }}
                  >
                    <Icon glyph="Edit" />
                  </IconButton>
                  <IconButton
                    aria-label="Delete relationship"
                    title="Delete relationship"
                    onClick={() => {
                      onDeleteRelationshipClick(r.id);
                    }}
                  >
                    <Icon glyph="Trash" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DMDrawerSection>
  );
};
