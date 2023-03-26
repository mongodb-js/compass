import React from 'react';
import {
  Combobox,
  TextInput,
  ComboboxOption,
  Select,
  Option,
  Icon,
  IconButton,
  Card,
  Subtitle,
  Button,
  Menu,
  MenuItem,
} from '@mongodb-js/compass-components';
import type { Field } from '.';

const MATCH_OPERATORS = [
  {
    name: '=',
    value: '$eq',
  },
  {
    name: '>',
    value: '$gt',
  },
  {
    name: '<',
    value: '$lt',
  },
  {
    name: '>=',
    value: '$gte',
  },
  {
    name: '<=',
    value: '$lte',
  },
];
const BSON_TYPES = ['Double', 'String', 'Numeric', 'ObjectID'];

type MatchFormField = {
  field: string;
  operator: string;
  value: string;
  type: string;
};
type MatchFormGroup = {
  logicalOperator: '$and' | '$or';
  conditions: MatchFormState;
};

type MatchFormState = Array<MatchFormField | MatchFormGroup>;

export const mapMatchFormToStageValue = (data: MatchFormState) => {
  const ret = {};
  data.map((x) => {
    if ('logicalOperator' in x) {
      ret[x.logicalOperator] = convertToStage(x.conditions);
      return ret;
    }

    ret[x.field] = {
      [x.operator]: x.value,
    };
    return ret;
  });
  return ret;
};

const MatchFormFields = ({
  data,
  fields: schemaFields,
  onChange,
}: {
  data: MatchFormField;
  fields: { name: string; value: string }[];
  onChange: (data: MatchFormField) => void;
}) => {
  const setData = (key: keyof MatchFormField, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ maxWidth: '200px', marginRight: '16px' }}>
        <Combobox
          aria-label="Select a field"
          size="default"
          clearable={false}
          initialValue={data.field}
          onChange={(value: string | null) => setData('field', value)}
        >
          {schemaFields.map(({ name, value }, index) => (
            <ComboboxOption
              key={`combobox-option-stage-${index}`}
              value={value}
              displayName={name}
            />
          ))}
        </Combobox>
      </div>
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-label="Select operator"
        aria-labelledby="Select operator"
        value={data.operator}
        onChange={(value) => setData('operator', value)}
      >
        {MATCH_OPERATORS.map((op) => {
          return (
            <Option key={op.name} value={op.value}>
              {op.name}
            </Option>
          );
        })}
      </Select>
      <TextInput
        aria-label="Value"
        placeholder="Value"
        value={data.value}
        onChange={(value) => setData('value', value.target.value)}
      />
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-label="Select bson type"
        aria-labelledby="Select bson type"
        value={data.type}
        onChange={(value) => setData('type', value)}
      >
        {BSON_TYPES.map((label) => {
          return (
            <Option key={label} value={label}>
              {label}
            </Option>
          );
        })}
      </Select>
    </div>
  );
};
const ActionButtons = ({
  onRemove,
  onAdd,
  onAddGroup,
}: {
  onRemove?: () => void;
  onAdd?: () => void;
  onAddGroup?: (type: '$and' | '$or') => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  return (
    <div>
      {onAdd && (
        <IconButton aria-label="Add" onClick={onAdd}>
          <Icon glyph="Plus" />
        </IconButton>
      )}
      {onRemove && (
        <IconButton aria-label="Remove" onClick={onRemove}>
          <Icon glyph="Minus" />
        </IconButton>
      )}
      {onAddGroup && (
        <Menu
          open={isMenuOpen}
          setOpen={setIsMenuOpen}
          data-testid="stage-option-menu-content"
          trigger={({ onClick, children }: any) => {
            return (
              <>
                <IconButton onClick={onClick} aria-label="More options">
                  <Icon glyph="Ellipsis" size="small"></Icon>
                </IconButton>
                {children}
              </>
            );
          }}
        >
          <MenuItem
            onClick={() => {
              onAddGroup('$and');
              setIsMenuOpen(false);
            }}
          >
            $and
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAddGroup('$or');
              setIsMenuOpen(false);
            }}
          >
            $or
          </MenuItem>
        </Menu>
      )}
    </div>
  );
};

export const MatchForm = ({
  fields,
  onChange,
  initialData = [],
}: {
  fields: Field[];
  onChange: (data: MatchFormState[]) => void;
  initialData?: MatchFormState[];
}) => {
  const onAdd = () => {
    const newInitialData = [...initialData];
    newInitialData.push({
      value: '',
      operator: '',
      type: 'string',
      field: '',
    });
    onChange(newInitialData);
  };
  const onRemove = (index: number) => {
    const newInitialData = [...initialData];
    newInitialData.splice(index, 1);
    onChange(newInitialData);
  };
  const onAddGroup = (type: '$and' | '$or') => {
    const newInitialData = [...initialData];
    newInitialData.push({
      logicalOperator: type,
      conditions: [],
    });
    onChange(newInitialData);
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        flexDirection: 'column',
        border: '1px solid #ececec',
        padding: '10px',
      }}
    >
      {initialData.map((item, index) => {
        if (
          ['$or', '$and'].includes(
            (item as unknown as MatchFormGroup).logicalOperator
          )
        ) {
          return (
            <Card>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <Subtitle>{item.logicalOperator}</Subtitle>
                {item.conditions.length === 0 && (
                  <ActionButtons
                    onAdd={() => {
                      const newInitialData = [...initialData];
                      newInitialData[index] = {
                        ...newInitialData[index],
                        conditions: [
                          {
                            value: '',
                            operator: '',
                            type: 'string',
                            field: '',
                          },
                        ],
                      };
                      onChange(newInitialData);
                    }}
                    onRemove={() => {
                      const newInitialData = [...initialData];
                      newInitialData.splice(index, 1);
                      onChange(newInitialData);
                    }}
                  />
                )}
              </div>
              <MatchForm
                fields={fields}
                initialData={item.conditions}
                onChange={(data) => {
                  const newInitialData = [...initialData];
                  newInitialData[index] = {
                    ...newInitialData[index],
                    conditions: data,
                  };
                  onChange(newInitialData);
                }}
              />
            </Card>
          );
        } else {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <MatchFormFields
                fields={fields}
                onChange={(data) => {
                  const newInitialData = [...initialData];
                  newInitialData[index] = data;
                  onChange(newInitialData);
                }}
                data={item}
                key={index}
              />
              <ActionButtons
                onAdd={onAdd}
                onRemove={() => onRemove(index)}
                onAddGroup={(op) => onAddGroup(op)}
              />
            </div>
          );
        }
      })}

      {initialData.length === 0 && (
        <Button onClick={onAdd}>Add new match field</Button>
      )}
    </div>
  );
};
