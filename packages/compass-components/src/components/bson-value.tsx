import React, { useMemo } from 'react';
import type { TypeCastMap } from 'hadron-type-checker';
import { Binary } from 'bson';
import type { DBRef } from 'bson';
import { variantColors } from '@leafygreen-ui/code';

import { Icon, Link } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { Theme, useDarkMode } from '../hooks/use-theme';

type ValueProps =
  | {
      [type in keyof TypeCastMap]: { type: type; value: TypeCastMap[type] };
    }[keyof TypeCastMap]
  | { type: 'DBRef'; value: DBRef };

function truncate(str: string, length = 70): string {
  const truncated = str.slice(0, length);
  return length < str.length ? `${truncated}…` : str;
}

type ValueTypes = ValueProps['type'];

type PropsByValueType<V extends ValueTypes> = Omit<
  Extract<ValueProps, { type: V }>,
  'type'
>;

const VALUE_COLOR_BY_THEME_AND_TYPE: Record<
  Theme,
  Partial<Record<ValueTypes, string>>
> = {
  [Theme.Dark]: {
    Int32: variantColors.dark[9],
    Double: variantColors.dark[9],
    Decimal128: variantColors.dark[9],
    Date: variantColors.dark[9],
    Boolean: variantColors.dark[10],
    String: variantColors.dark[7],
    ObjectId: variantColors.dark[5],
  },
  [Theme.Light]: {
    Int32: variantColors.light[9],
    Double: variantColors.light[9],
    Decimal128: variantColors.light[9],
    Date: variantColors.light[9],
    Boolean: variantColors.light[10],
    String: variantColors.light[7],
    ObjectId: variantColors.light[5],
  },
};

const bsonValue = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const bsonValuePrewrap = css({
  whiteSpace: 'pre-wrap',
});

export const BSONValueContainer: React.FunctionComponent<
  React.HTMLProps<HTMLDivElement> & {
    type?: ValueTypes;
    chidren?: React.ReactChildren;
  }
> = ({ type, children, className, ...props }) => {
  const darkMode = useDarkMode();
  const color = useMemo(() => {
    if (!type) {
      return;
    }
    return VALUE_COLOR_BY_THEME_AND_TYPE[darkMode ? Theme.Dark : Theme.Light][
      type
    ];
  }, [type, darkMode]);

  return (
    <div
      {...props}
      className={cx(
        className,
        bsonValue,
        type === 'String' && bsonValuePrewrap,
        `element-value element-value-is-${
          type ? type.toLowerCase() : 'unknown'
        }`
      )}
      style={{ color }}
    >
      {children}
    </div>
  );
};

const nonSelectable = css({
  userSelect: 'none',
});

const encryptedHelpLinkStyle = css({
  color: 'inherit',
  marginLeft: spacing[1],
});

const ObjectIdValue: React.FunctionComponent<PropsByValueType<'ObjectId'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return String(value);
  }, [value]);

  return (
    <BSONValueContainer type="ObjectId" title={stringifiedValue}>
      <span className={nonSelectable}>ObjectId(&apos;</span>
      {stringifiedValue}
      <span className={nonSelectable}>&apos;)</span>
    </BSONValueContainer>
  );
};

const BinaryValue: React.FunctionComponent<PropsByValueType<'Binary'>> = ({
  value,
}) => {
  const { stringifiedValue, title, additionalHints } = useMemo(() => {
    if (value.sub_type === Binary.SUBTYPE_ENCRYPTED) {
      return {
        stringifiedValue: '*********',
        title: 'Encrypted',
        additionalHints: (
          <Link
            className={encryptedHelpLinkStyle}
            hideExternalIcon={true}
            href="https://www.mongodb.com/docs/compass/current/in-use-encryption-tutorial/"
            aria-label="Compass In-Use Encryption documentation"
            title="Compass In-Use Encryption documentation"
            data-testid="bson-value-in-use-encryption-docs-link"
          >
            <Icon size="small" glyph="QuestionMarkWithCircle"></Icon>
          </Link>
        ),
      };
    }
    if (value.sub_type === Binary.SUBTYPE_UUID) {
      let uuid: string;

      try {
        // Try to get the pretty hex version of the UUID
        uuid = value.toUUID().toString();
      } catch {
        // If uuid is not following the uuid format converting it to UUID will
        // fail, we don't want the UI to fail rendering it and instead will
        // just display "unformatted" hex value of the binary whatever it is
        uuid = value.toString('hex');
      }

      return { stringifiedValue: `UUID('${uuid}')` };
    }
    return {
      stringifiedValue: `Binary.createFromBase64('${truncate(
        value.toString('base64'),
        100
      )}', ${value.sub_type})`,
    };
  }, [value]);

  return (
    <BSONValueContainer type="Binary" title={title ?? stringifiedValue}>
      {stringifiedValue}
      {additionalHints}
    </BSONValueContainer>
  );
};

const CodeValue: React.FunctionComponent<PropsByValueType<'Code'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `Code('${String(value.code)}'${
      value.scope ? `, ${JSON.stringify(value.scope)}` : ''
    })`;
  }, [value.code, value.scope]);

  return (
    <BSONValueContainer type="Code" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const DateValue: React.FunctionComponent<PropsByValueType<'Date'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    try {
      return new Date(value).toISOString().replace('Z', '+00:00');
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <BSONValueContainer type="Date" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const NumberValue: React.FunctionComponent<
  PropsByValueType<'Int32' | 'Double'> & { type: 'Int32' | 'Double' }
> = ({ type, value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value.valueOf());
  }, [value]);

  return (
    <BSONValueContainer type={type} title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const StringValue: React.FunctionComponent<PropsByValueType<'String'>> = ({
  value,
}) => {
  const truncatedValue = useMemo(() => {
    return truncate(value, 70);
  }, [value]);

  return (
    <BSONValueContainer type="String" title={value}>
      &quot;{truncatedValue}&quot;
    </BSONValueContainer>
  );
};

const RegExpValue: React.FunctionComponent<PropsByValueType<'BSONRegExp'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `/${value.pattern}/${value.options}`;
  }, [value.pattern, value.options]);

  return (
    <BSONValueContainer type="BSONRegExp" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const TimestampValue: React.FunctionComponent<
  PropsByValueType<'Timestamp'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return `Timestamp({ t: ${value.getHighBits()}, i: ${value.getLowBits()} })`;
  }, [value]);

  return (
    <BSONValueContainer type="Timestamp" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const KeyValue: React.FunctionComponent<{
  type: 'MinKey' | 'MaxKey';
}> = ({ type }) => {
  const stringifiedValue = useMemo(() => {
    return `${type}()`;
  }, [type]);

  return (
    <BSONValueContainer type={type} title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const DBRefValue: React.FunctionComponent<PropsByValueType<'DBRef'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `DBRef('${value.collection}', '${String(value.oid)}'${
      value?.db ? `, '${value.db}'` : ''
    })`;
  }, [value.collection, value.oid, value.db]);

  return (
    <BSONValueContainer type="DBRef" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const SymbolValue: React.FunctionComponent<PropsByValueType<'BSONSymbol'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `Symbol('${String(value)}')`;
  }, [value]);

  return (
    <BSONValueContainer type="BSONSymbol" title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const UnknownValue: React.FunctionComponent<{
  type: string;
  value: unknown;
}> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value);
  }, [value]);

  return (
    <BSONValueContainer title={stringifiedValue}>
      {stringifiedValue}
    </BSONValueContainer>
  );
};

const ArrayValue: React.FunctionComponent<PropsByValueType<'Array'>> = ({
  value,
}) => {
  const lengthString = useMemo(() => {
    return `(${value.length > 0 ? value.length : 'empty'})`;
  }, [value.length]);

  return (
    <BSONValueContainer title={`Array ${lengthString}`}>
      Array {lengthString}
    </BSONValueContainer>
  );
};

const BSONValue: React.FunctionComponent<ValueProps> = (props) => {
  switch (props.type) {
    case 'ObjectId':
      return <ObjectIdValue value={props.value}></ObjectIdValue>;
    case 'Date':
      return <DateValue value={props.value}></DateValue>;
    case 'Binary':
      return <BinaryValue value={props.value}></BinaryValue>;
    case 'Int32':
    case 'Double':
      return <NumberValue type={props.type} value={props.value}></NumberValue>;
    case 'String':
      return <StringValue value={props.value}></StringValue>;
    case 'BSONRegExp':
      return <RegExpValue value={props.value}></RegExpValue>;
    case 'Code':
      return <CodeValue value={props.value}></CodeValue>;
    case 'MinKey':
    case 'MaxKey':
      return <KeyValue type={props.type}></KeyValue>;
    case 'DBRef':
      return <DBRefValue value={props.value}></DBRefValue>;
    case 'Timestamp':
      return <TimestampValue value={props.value}></TimestampValue>;
    case 'BSONSymbol':
      return <SymbolValue value={props.value}></SymbolValue>;
    case 'Array':
      return <ArrayValue value={props.value}></ArrayValue>;
    case 'Object':
      return <UnknownValue type={props.type} value={props.type}></UnknownValue>;
    default:
      return (
        <UnknownValue type={props.type} value={props.value}></UnknownValue>
      );
  }
};

export default BSONValue;
