import React from 'react';
import { Select, Option, css, spacing } from '@mongodb-js/compass-components';
import { connect } from '../../../stores/context';
import {
  addFilterRule,
  removeFilterRule,
  setCombinator,
  updateFilterRule,
} from '../../../stores/query-bar-reducer';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../../../stores/query-bar-store';
import type {
  FilterCombinator,
  FilterRule,
  ValueDragPayload,
} from '../../../utils/visual-builder-serialize';
import type { VisualBuilderOperator } from '../../../constants/visual-builder-operators';
import { DropZone } from '../drop-zone';
import { FilterRuleRow } from './filter-rule-row';

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  marginBottom: spacing[100],
});

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

type Props = {
  rules: FilterRule[];
  combinator: FilterCombinator;
  onCombinatorChange: (combinator: FilterCombinator) => void;
  onOperatorChange: (id: string, op: VisualBuilderOperator) => void;
  onValueChange: (id: string, valueString: string) => void;
  onRemove: (id: string) => void;
  onValueDrop?: (payload: ValueDragPayload) => void;
};

function FilterZone({
  rules,
  combinator,
  onCombinatorChange,
  onOperatorChange,
  onValueChange,
  onRemove,
  onValueDrop,
}: Props) {
  return (
    <div className={containerStyles} data-testid="visual-query-builder-filter">
      <div className={headerStyles}>
        <Select
          aria-label="Filter combinator"
          allowDeselect={false}
          size="small"
          value={combinator}
          onChange={(v: string) => onCombinatorChange(v as FilterCombinator)}
          data-testid="visual-query-builder-combinator"
        >
          <Option value="$and">Match all of ($and)</Option>
          <Option value="$or">Match any of ($or)</Option>
        </Select>
      </div>
      <DropZone
        id="zone-filter"
        isEmpty={rules.length === 0}
        onValueDrop={onValueDrop}
      >
        {rules.map((rule) => (
          <FilterRuleRow
            key={rule.id}
            rule={rule}
            onOperatorChange={(op) => onOperatorChange(rule.id, op)}
            onValueChange={(v) => onValueChange(rule.id, v)}
            onValueDrop={(payload) =>
              onValueChange(rule.id, payload.valueString)
            }
            onRemove={() => onRemove(rule.id)}
          />
        ))}
      </DropZone>
    </div>
  );
}

export default connect(
  (state: RootState) => ({
    rules: state.queryBar.visualBuilder.rules,
    combinator: state.queryBar.visualBuilder.combinator,
  }),
  (dispatch: QueryBarThunkDispatch) => ({
    onCombinatorChange: (combinator: FilterCombinator) =>
      dispatch(setCombinator(combinator)),
    onOperatorChange: (id: string, op: VisualBuilderOperator) =>
      dispatch(updateFilterRule(id, { operator: op })),
    onValueChange: (id: string, valueString: string) =>
      dispatch(updateFilterRule(id, { valueString })),
    onRemove: (id: string) => dispatch(removeFilterRule(id)),
    onValueDrop: (payload: ValueDragPayload) =>
      dispatch(
        addFilterRule({
          path: payload.path,
          bsonType: payload.bsonType,
          valueString: payload.valueString,
        })
      ),
  })
)(FilterZone);
