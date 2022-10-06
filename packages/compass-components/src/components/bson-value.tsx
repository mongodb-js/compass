import React, { useMemo } from 'react';
import type { TypeCastMap, TypeCastTypes } from 'hadron-type-checker';
import { Binary } from 'bson';
import type { DBRef } from 'bson';

import { Icon, Link } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

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

export const VALUE_COLOR_BY_TYPE: Record<
  Extract<
    TypeCastTypes,
    | 'Int32'
    | 'Double'
    | 'Decimal128'
    | 'Date'
    | 'Boolean'
    | 'String'
    | 'ObjectId'
  >,
  string
> = {
  Int32: '#00684a',
  Double: '#00684A',
  Decimal128: '#00684A',
  Date: '#970606',
  Boolean: '#5E0C9E',
  String: '#1254B7',
  ObjectId: '#DB3030',
};

export function hasCustomColor(
  type: ValueTypes | string
): type is keyof typeof VALUE_COLOR_BY_TYPE {
  return type in VALUE_COLOR_BY_TYPE;
}

const bsonValue = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'inline',
});

const bsonValuePrewrap = css({
  whiteSpace: 'pre-wrap',
});

function getStyles(type: ValueTypes | string): string {
  return cx(
    bsonValue,
    type === 'String' && bsonValuePrewrap,
    hasCustomColor(type) &&
      css({
        color: VALUE_COLOR_BY_TYPE[type],
      }),
    `element-value element-value-is-${type.toLowerCase()}`
  );
}

const nonSelectable = css({
  userSelect: 'none',
});

const encryptedHelpLinkStyle = css({
  color: 'inherit',
  marginLeft: spacing[1],
});

export const ObjectIdValue: React.FunctionComponent<
  PropsByValueType<'ObjectId'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value);
  }, [value]);

  return (
    <div className={getStyles('ObjectId')} title={stringifiedValue}>
      <span className={nonSelectable}>ObjectId(&apos;</span>
      {stringifiedValue}
      <span className={nonSelectable}>&apos;)</span>
    </div>
  );
};

export const BinaryValue: React.FunctionComponent<
  PropsByValueType<'Binary'>
> = ({ value }) => {
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
      // The shell displays these values as Binary(Buffer.from(<hex string>, 'hex'), <subtype>).
      // This would be a bit nicer here, since we want to encourage usage of standard Node.js
      // driver types, but Buffer.from() is not something that Compass understands (and maybe
      // shouldn't understand) in text input, and passing a string to Binary() is a legacy
      // concept as well.
      stringifiedValue: `BinData(${value.sub_type}, '${truncate(
        value.toString('base64'),
        100
      )}')`,
    };
  }, [value]);

  return (
    <div className={getStyles('Binary')} title={title ?? stringifiedValue}>
      {stringifiedValue}
      {additionalHints}
    </div>
  );
};

export const CodeValue: React.FunctionComponent<PropsByValueType<'Code'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `Code('${String(value.code)}'${
      value.scope ? `, ${JSON.stringify(value.scope)}` : ''
    })`;
  }, [value.code, value.scope]);

  return (
    <div className={getStyles('Code')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const DateValue: React.FunctionComponent<PropsByValueType<'Date'>> = ({
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
    <div className={getStyles('Date')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const NumberValue: React.FunctionComponent<
  PropsByValueType<'Int32' | 'Double'> & { type: 'Int32' | 'Double' }
> = ({ type, value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value.valueOf());
  }, [value]);

  return (
    <div className={getStyles(type)} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const StringValue: React.FunctionComponent<
  PropsByValueType<'String'>
> = ({ value }) => {
  const truncatedValue = useMemo(() => {
    return truncate(value, 70);
  }, [value]);

  return (
    <div className={getStyles('String')} title={value}>
      &quot;{truncatedValue}&quot;
    </div>
  );
};

export const RegExpValue: React.FunctionComponent<
  PropsByValueType<'BSONRegExp'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return `/${value.pattern}/${value.options}`;
  }, [value.pattern, value.options]);

  return (
    <div className={getStyles('BSONRegExp')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const TimestampValue: React.FunctionComponent<
  PropsByValueType<'Timestamp'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return `Timestamp({ t: ${value.getHighBits()}, i: ${value.getLowBits()} })`;
  }, [value]);

  return (
    <div className={getStyles('Timestamp')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const KeyValue: React.FunctionComponent<{
  type: 'MinKey' | 'MaxKey';
}> = ({ type }) => {
  const stringifiedValue = useMemo(() => {
    return `${type}()`;
  }, [type]);

  return (
    <div className={getStyles(type)} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const DBRefValue: React.FunctionComponent<PropsByValueType<'DBRef'>> = ({
  value,
}) => {
  const stringifiedValue = useMemo(() => {
    return `DBRef('${value.collection}', '${String(value.oid)}'${
      value?.db ? `, '${value.db}'` : ''
    })`;
  }, [value.collection, value.oid, value.db]);

  return (
    <div className={getStyles('DBRef')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const SymbolValue: React.FunctionComponent<
  PropsByValueType<'BSONSymbol'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return `Symbol('${String(value)}')`;
  }, [value]);

  return (
    <div className={getStyles('Symbol')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const UnknownValue: React.FunctionComponent<{
  type: string;
  value: unknown;
}> = ({ type, value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value);
  }, [value]);

  return (
    <div className={getStyles(type)} title={stringifiedValue}>
      {stringifiedValue}
    </div>
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
    case 'Object':
    case 'Array':
      return <UnknownValue type={props.type} value={props.type}></UnknownValue>;
    default:
      return (
        <UnknownValue type={props.type} value={props.value}></UnknownValue>
      );
  }
};

export default BSONValue;
