import React, { useMemo } from 'react';
import { Binary } from 'bson';
import type {
  Code,
  Double,
  Int32,
  Long,
  BSONRegExp,
  Timestamp,
  DBRef,
  MaxKey,
  MinKey,
  ObjectId,
  BSONSymbol,
  Decimal128,
} from 'bson';
import { css } from '..';

type BSONValueProps =
  | { type: 'Binary'; value: Binary }
  | { type: 'Code'; value: Code }
  | { type: 'Double'; value: Double }
  | { type: 'Int32'; value: Int32 }
  | { type: 'Long'; value: Long }
  | { type: 'BSONRegExp'; value: BSONRegExp }
  | { type: 'Timestamp'; value: Timestamp }
  | { type: 'DBRef'; value: DBRef }
  | { type: 'MaxKey'; value: MaxKey }
  | { type: 'MinKey'; value: MinKey }
  | { type: 'ObjectId'; value: ObjectId }
  | { type: 'Symbol'; value: BSONSymbol }
  | { type: 'Decimal128'; value: Decimal128 };

type ValueProps =
  | BSONValueProps
  | { type: 'Date'; value: Date; tz?: string }
  | { type: 'String'; value: string }
  | { type: 'Undefined'; value: undefined }
  | { type: 'Null'; value: null }
  | { type: 'Boolean'; value: boolean };

function truncate(str: string, length = 70): string {
  const truncated = str.slice(0, length);
  return length < str.length ? `${truncated}…` : str;
}

type ValueTypes = ValueProps['type'];

type PropsByValueType<V extends ValueTypes> = Omit<
  Extract<ValueProps, { type: V }>,
  'type'
>;

function getClassName(
  type: ValueTypes | Lowercase<ValueTypes> | string
): string {
  return `element-value element-value-is-${type.toLowerCase()}`;
}

const nonSelectable = css({
  userSelect: 'none',
});

export const ObjectIdValue: React.FunctionComponent<
  PropsByValueType<'ObjectId'>
> = ({ value }) => {
  const stringifiedValue = useMemo(() => {
    return String(value);
  }, [value]);

  return (
    <div className={getClassName('objectid')} title={stringifiedValue}>
      <span className={nonSelectable}>ObjectId(&apos;</span>
      {stringifiedValue}
      <span className={nonSelectable}>&apos;)</span>
    </div>
  );
};

export const BinaryValue: React.FunctionComponent<PropsByValueType<'Binary'>> =
  ({ value }) => {
    const { stringifiedValue, title } = useMemo(() => {
      if (value.sub_type === Binary.SUBTYPE_ENCRYPTED) {
        return {
          stringifiedValue: '*********',
          title: 'Encrypted',
        };
      }
      if (value.sub_type === Binary.SUBTYPE_UUID) {
        return { stringifiedValue: `UUID('${value.toUUID().toHexString()}')` };
      }
      return {
        stringifiedValue: `Binary('${truncate(
          value.toString('base64'),
          100
        )}', ${value.sub_type})`,
      };
    }, [value]);

    return (
      <div className={getClassName('binary')} title={title ?? stringifiedValue}>
        {stringifiedValue}
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
    <div className={getClassName('code')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const DateValue: React.FunctionComponent<PropsByValueType<'Date'>> = ({
  value,
  // NB: Compass (and dependants like Cloud) currently only support showing
  // timezone in UTC, to avoid all the complexity of formatting with timezone
  // included we ignore this logic for now, but we probably want to allow users
  // to select timezone and display the output based on their settings. We can
  // add support for this later when we really need / want to
  // tz,
}) => {
  const stringifiedValue = useMemo(() => {
    return new Date(value).toISOString().replace('Z', '+00:00');
  }, [value]);

  return (
    <div className={getClassName('date')} title={stringifiedValue}>
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
    <div className={getClassName(type)} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const StringValue: React.FunctionComponent<PropsByValueType<'String'>> =
  ({ value }) => {
    const truncatedValue = useMemo(() => {
      return truncate(value, 70);
    }, [value]);

    return (
      <div className={getClassName('string')} title={value}>
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
    <div className={getClassName('BSONRegExp')} title={stringifiedValue}>
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
    <div className={getClassName('timestamp')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const KeyValue: React.FunctionComponent<{ type: 'MinKey' | 'MaxKey' }> =
  ({ type }) => {
    const stringifiedValue = useMemo(() => {
      return `${type}()`;
    }, [type]);

    return (
      <div className={getClassName(type)} title={stringifiedValue}>
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
    <div className={getClassName('dbref')} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

export const SymbolValue: React.FunctionComponent<PropsByValueType<'Symbol'>> =
  ({ value }) => {
    const stringifiedValue = useMemo(() => {
      return `Symbol('${String(value)}')`;
    }, [value]);

    return (
      <div className={getClassName('symbol')} title={stringifiedValue}>
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
    <div className={getClassName(type)} title={stringifiedValue}>
      {stringifiedValue}
    </div>
  );
};

const BSONValue: React.FunctionComponent<ValueProps> = (props) => {
  switch (props.type) {
    case 'ObjectId':
      return <ObjectIdValue value={props.value}></ObjectIdValue>;
    case 'Date':
      return <DateValue value={props.value} tz={props.tz}></DateValue>;
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
    case 'Symbol':
      return <SymbolValue value={props.value}></SymbolValue>;
    default:
      return (
        <UnknownValue type={props.type} value={props.value}></UnknownValue>
      );
  }
};

export default BSONValue;
