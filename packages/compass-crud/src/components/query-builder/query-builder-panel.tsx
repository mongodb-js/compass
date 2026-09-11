import React, { useCallback, useState } from 'react';
import {
  Body,
  Button,
  Checkbox,
  DocumentList,
  Icon,
  IconButton,
  Option,
  Select,
  TextInput,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  BuilderState,
  ConditionOperator,
  ConditionRow,
  ProjectionRow,
  SortRow,
} from './builder-query';
import {
  CONDITION_OPERATORS,
  isValuelessOperator,
  nextRowId,
  valueToText,
} from './builder-query';

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[200],
  // Scrolling belongs to the container that owns the pane height. Scrolling
  // here as well produced a second scrollbar drawn over the sections.
});

const section = css({
  border: `1px solid ${palette.gray.light1}`,
  borderRadius: spacing[100],
  overflow: 'hidden',
});

const sectionDark = css({
  borderColor: palette.gray.dark2,
});

const sectionHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  backgroundColor: palette.gray.light2,
});

const sectionHeaderDark = css({
  backgroundColor: palette.gray.dark2,
});

const sectionBody = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  padding: spacing[200],
});

const toolbar = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const grow = css({ flex: 1, minWidth: 0 });

const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  // The panel can be narrowed to about 280px, which is not enough for a field,
  // an operator and a value side by side. Wrapping keeps every control at a
  // readable width instead of squeezing them to slivers.
  flexWrap: 'wrap',
});

// Selects size their menu to their trigger, so a trigger squeezed to a few
// pixels opens a menu nobody can read. Each control gets its own basis.
const fieldCell = css({ flex: '1 1 110px', minWidth: 96 });
const valueCell = css({ flex: '1 1 110px', minWidth: 96 });
// Wide enough for the longest label in each menu, since a select's menu is as
// wide as its trigger and a narrow one wraps every option onto several lines.
const operatorCell = css({ flex: '0 0 136px' });
const modeCell = css({ flex: '0 0 120px' });
const directionCell = css({ flex: '0 0 152px' });

const optionLabel = css({
  whiteSpace: 'nowrap',
});

const dragHandle = css({
  flex: 'none',
  color: palette.gray.base,
  cursor: 'grab',
  display: 'flex',
  alignItems: 'center',
});

const dropZone = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[100],
  padding: spacing[200],
  border: `1px dashed ${palette.gray.base}`,
  borderRadius: spacing[100],
  color: palette.gray.dark1,
  cursor: 'pointer',
  userSelect: 'none',
  textAlign: 'center',
});

const dropZoneDark = css({
  color: palette.gray.light1,
});

const dropZoneActive = css({
  borderColor: palette.green.base,
  borderStyle: 'solid',
  backgroundColor: palette.green.light3,
  color: palette.green.dark2,
});

const dropZoneActiveDark = css({
  borderColor: palette.green.base,
  borderStyle: 'solid',
  backgroundColor: palette.green.dark3,
  color: palette.green.light2,
});

const errorList = css({
  color: palette.red.base,
  padding: `0 ${spacing[200]}px ${spacing[200]}px`,
});

/**
 * A drop target for fields dragged out of the document list. Double clicking
 * adds an empty row, for building a query without a document to drag from.
 */
const FieldDropZone: React.FunctionComponent<{
  label: string;
  testId: string;
  onFieldDropped: (field: string, value: unknown) => void;
  onAddEmpty: () => void;
}> = ({ label, testId, onFieldDropped, onAddEmpty }) => {
  const darkMode = useDarkMode();
  const [isDragOver, setIsDragOver] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (
      !Array.from(event.dataTransfer.types).includes(
        DocumentList.DOCUMENT_FIELD_DRAG_TYPE
      )
    ) {
      return;
    }
    // Without preventDefault the browser refuses the drop.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const dragged = DocumentList.getDraggedDocumentField(event.dataTransfer);
      setIsDragOver(false);
      if (!dragged) {
        return;
      }
      event.preventDefault();
      onFieldDropped(dragged.field, dragged.value);
    },
    [onFieldDropped]
  );

  return (
    <div
      className={cx(
        dropZone,
        darkMode && dropZoneDark,
        isDragOver && (darkMode ? dropZoneActiveDark : dropZoneActive)
      )}
      data-testid={testId}
      onDragOver={onDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      onDoubleClick={onAddEmpty}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onAddEmpty();
        }
      }}
    >
      <Icon glyph="Plus" size="small" />
      <span>{label}</span>
    </div>
  );
};

const RowShell: React.FunctionComponent<{
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}> = ({ onRemove, removeLabel, children }) => {
  return (
    <div className={row}>
      <span className={dragHandle} aria-hidden="true">
        <Icon glyph="Drag" size="small" />
      </span>
      {children}
      <IconButton
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
      >
        <Icon glyph="Trash" size="small" />
      </IconButton>
    </div>
  );
};

const SectionShell: React.FunctionComponent<{
  title: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, enabled, onEnabledChange, headerExtra, children }) => {
  const darkMode = useDarkMode();
  return (
    <section className={cx(section, darkMode && sectionDark)}>
      <div className={cx(sectionHeader, darkMode && sectionHeaderDark)}>
        <Body weight="medium">{title}</Body>
        <div className={toolbar}>
          {headerExtra}
          <Checkbox
            aria-label={`Use ${title.toLowerCase()}`}
            title={`Use ${title.toLowerCase()}`}
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
        </div>
      </div>
      <div className={sectionBody}>{children}</div>
    </section>
  );
};

export type QueryBuilderPanelProps = {
  state: BuilderState;
  onChange: (state: BuilderState) => void;
  onRun: () => void;
  errors: string[];
};

export const QueryBuilderPanel: React.FunctionComponent<
  QueryBuilderPanelProps
> = ({ state, onChange, onRun, errors }) => {
  const update = useCallback(
    (patch: Partial<BuilderState>) => onChange({ ...state, ...patch }),
    [onChange, state]
  );

  const updateCondition = (id: string, patch: Partial<ConditionRow>) =>
    update({
      conditions: state.conditions.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });

  const updateProjection = (id: string, patch: Partial<ProjectionRow>) =>
    update({
      projections: state.projections.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });

  const updateSort = (id: string, patch: Partial<SortRow>) =>
    update({
      sorts: state.sorts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  return (
    <div className={panel} data-testid="query-builder-panel">
      <SectionShell
        title="Query"
        enabled={state.queryEnabled}
        onEnabledChange={(queryEnabled) => update({ queryEnabled })}
      >
        <div className={toolbar}>
          <div className={grow}>
            <Select
              aria-label="Combine conditions with"
              size="small"
              allowDeselect={false}
              value={state.match}
              onChange={(match) => update({ match: match as 'and' | 'or' })}
            >
              <Option value="and" className={optionLabel}>
                Match all ($and)
              </Option>
              <Option value="or" className={optionLabel}>
                Match any ($or)
              </Option>
            </Select>
          </div>
          <Button
            size="small"
            onClick={() => update({ conditions: [] })}
            disabled={state.conditions.length === 0}
          >
            Clear
          </Button>
          <Button size="small" variant="primary" onClick={onRun}>
            Run
          </Button>
        </div>

        {state.conditions.map((condition) => (
          <RowShell
            key={condition.id}
            removeLabel={`Remove condition on ${condition.field || 'field'}`}
            onRemove={() =>
              update({
                conditions: state.conditions.filter(
                  (c) => c.id !== condition.id
                ),
              })
            }
          >
            <Checkbox
              aria-label={`Use condition on ${condition.field || 'field'}`}
              checked={condition.enabled}
              onChange={(event) =>
                updateCondition(condition.id, { enabled: event.target.checked })
              }
            />
            <div className={fieldCell}>
              <TextInput
                aria-label="Field"
                placeholder="field"
                sizeVariant="small"
                value={condition.field}
                onChange={(event) =>
                  updateCondition(condition.id, { field: event.target.value })
                }
              />
            </div>
            <div className={operatorCell}>
              <Select
                aria-label="Operator"
                size="small"
                allowDeselect={false}
                value={condition.operator}
                onChange={(operator) =>
                  updateCondition(condition.id, {
                    operator: operator as ConditionOperator,
                  })
                }
              >
                {CONDITION_OPERATORS.map((op) => (
                  <Option
                    key={op.value}
                    value={op.value}
                    className={optionLabel}
                  >
                    {op.label}
                  </Option>
                ))}
              </Select>
            </div>
            {!isValuelessOperator(condition.operator) && (
              <div className={valueCell}>
                <TextInput
                  aria-label="Value"
                  placeholder="value"
                  sizeVariant="small"
                  value={condition.valueText}
                  onChange={(event) =>
                    updateCondition(condition.id, {
                      valueText: event.target.value,
                    })
                  }
                />
              </div>
            )}
          </RowShell>
        ))}

        <FieldDropZone
          testId="query-builder-query-drop-zone"
          label="Drag and drop field here or double-click"
          onFieldDropped={(field, value) =>
            update({
              conditions: [
                ...state.conditions,
                {
                  id: nextRowId('condition'),
                  field,
                  operator: 'eq',
                  valueText: valueToText(value),
                  enabled: true,
                },
              ],
            })
          }
          onAddEmpty={() =>
            update({
              conditions: [
                ...state.conditions,
                {
                  id: nextRowId('condition'),
                  field: '',
                  operator: 'eq',
                  valueText: '',
                  enabled: true,
                },
              ],
            })
          }
        />
      </SectionShell>

      <SectionShell
        title="Projection"
        enabled={state.projectionEnabled}
        onEnabledChange={(projectionEnabled) => update({ projectionEnabled })}
      >
        {state.projections.map((projection) => (
          <RowShell
            key={projection.id}
            removeLabel={`Remove ${
              projection.field || 'field'
            } from projection`}
            onRemove={() =>
              update({
                projections: state.projections.filter(
                  (p) => p.id !== projection.id
                ),
              })
            }
          >
            <Checkbox
              aria-label={`Use ${projection.field || 'field'} in projection`}
              checked={projection.enabled}
              onChange={(event) =>
                updateProjection(projection.id, {
                  enabled: event.target.checked,
                })
              }
            />
            <div className={fieldCell}>
              <TextInput
                aria-label="Projection field"
                placeholder="field"
                sizeVariant="small"
                value={projection.field}
                onChange={(event) =>
                  updateProjection(projection.id, { field: event.target.value })
                }
              />
            </div>
            <div className={modeCell}>
              <Select
                aria-label="Include or exclude"
                size="small"
                allowDeselect={false}
                value={projection.mode}
                onChange={(mode) =>
                  updateProjection(projection.id, {
                    mode: mode as 'include' | 'exclude',
                  })
                }
              >
                <Option value="include" className={optionLabel}>
                  include
                </Option>
                <Option value="exclude" className={optionLabel}>
                  exclude
                </Option>
              </Select>
            </div>
          </RowShell>
        ))}

        <FieldDropZone
          testId="query-builder-projection-drop-zone"
          label="Drag and drop fields here or double-click"
          onFieldDropped={(field) =>
            update({
              projections: [
                ...state.projections,
                {
                  id: nextRowId('projection'),
                  field,
                  mode: 'include',
                  enabled: true,
                },
              ],
            })
          }
          onAddEmpty={() =>
            update({
              projections: [
                ...state.projections,
                {
                  id: nextRowId('projection'),
                  field: '',
                  mode: 'include',
                  enabled: true,
                },
              ],
            })
          }
        />
      </SectionShell>

      <SectionShell
        title="Sort"
        enabled={state.sortEnabled}
        onEnabledChange={(sortEnabled) => update({ sortEnabled })}
      >
        {state.sorts.map((sortRow) => (
          <RowShell
            key={sortRow.id}
            removeLabel={`Remove ${sortRow.field || 'field'} from sort`}
            onRemove={() =>
              update({ sorts: state.sorts.filter((s) => s.id !== sortRow.id) })
            }
          >
            <Checkbox
              aria-label={`Use ${sortRow.field || 'field'} in sort`}
              checked={sortRow.enabled}
              onChange={(event) =>
                updateSort(sortRow.id, { enabled: event.target.checked })
              }
            />
            <div className={fieldCell}>
              <TextInput
                aria-label="Sort field"
                placeholder="field"
                sizeVariant="small"
                value={sortRow.field}
                onChange={(event) =>
                  updateSort(sortRow.id, { field: event.target.value })
                }
              />
            </div>
            <div className={directionCell}>
              <Select
                aria-label="Sort direction"
                size="small"
                allowDeselect={false}
                value={sortRow.direction}
                onChange={(direction) =>
                  updateSort(sortRow.id, {
                    direction: direction as 'asc' | 'desc',
                  })
                }
              >
                <Option value="asc" className={optionLabel}>
                  ascending (1)
                </Option>
                <Option value="desc" className={optionLabel}>
                  descending (-1)
                </Option>
              </Select>
            </div>
          </RowShell>
        ))}

        <FieldDropZone
          testId="query-builder-sort-drop-zone"
          label="Drag and drop fields here or double-click"
          onFieldDropped={(field) =>
            update({
              sorts: [
                ...state.sorts,
                {
                  id: nextRowId('sort'),
                  field,
                  direction: 'asc',
                  enabled: true,
                },
              ],
            })
          }
          onAddEmpty={() =>
            update({
              sorts: [
                ...state.sorts,
                {
                  id: nextRowId('sort'),
                  field: '',
                  direction: 'asc',
                  enabled: true,
                },
              ],
            })
          }
        />
      </SectionShell>

      <SectionShell
        title="Skip and limit"
        enabled={true}
        onEnabledChange={() => undefined}
      >
        <div className={toolbar}>
          <div className={grow}>
            <TextInput
              aria-label="Skip"
              label="Skip"
              placeholder="0"
              sizeVariant="small"
              value={state.skip}
              onChange={(event) => update({ skip: event.target.value })}
            />
          </div>
          <div className={grow}>
            <TextInput
              aria-label="Limit"
              label="Limit"
              placeholder="none"
              sizeVariant="small"
              value={state.limit}
              onChange={(event) => update({ limit: event.target.value })}
            />
          </div>
        </div>
      </SectionShell>

      {errors.length > 0 && (
        <ul className={errorList} data-testid="query-builder-errors">
          {errors.map((error) => (
            <li key={error}>
              <Body>{error}</Body>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QueryBuilderPanel;
