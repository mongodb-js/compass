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
  Tooltip,
} from '@mongodb-js/compass-components';
import type { Relationship } from '../../services/data-model-storage';
import { getDefaultRelationshipName } from '../../utils';
import { isRelationshipInvalid } from '../../utils/utils';

const titleBtnStyles = css({
  marginLeft: 'auto',
  maxHeight: 20, // To match accordion line height
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
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

const relationshipNameWrapperStyles = css({
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  paddingRight: spacing[200],
});

const relationshipNameStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const warnIconWrapperStyles = css({
  display: 'flex',
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
            Add Relationship
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
                  <div className={relationshipNameWrapperStyles}>
                    <span
                      className={relationshipNameStyles}
                      title={relationshipLabel}
                    >
                      {relationshipLabel}
                    </span>
                    {isRelationshipInvalid(r) && (
                      <Tooltip
                        trigger={
                          <div className={warnIconWrapperStyles}>
                            <Icon
                              glyph="Warning"
                              color={palette.yellow.light2}
                            />
                          </div>
                        }
                      >
                        Can not resolve the relationship - please verify the
                        linked fields and namespace.
                      </Tooltip>
                    )}
                  </div>
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
