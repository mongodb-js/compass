import React, { useMemo } from 'react';
import type { TypeCastMap } from 'hadron-type-checker';
import { Binary } from 'bson';
import type { DBRef } from 'bson';
import { variantColors } from '@leafygreen-ui/code';

import { Icon, Link } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import type { Theme } from '../hooks/use-theme';
import { Themes, useDarkMode } from '../hooks/use-theme';
import { useLegacyUUIDDisplayContext } from './document-list/legacy-uuid-format-context';

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
  [Themes.Dark]: {
    Int32: variantColors.dark[9],
    Double: variantColors.dark[9],
    Decimal128: variantColors.dark[9],
    Date: variantColors.dark[9],
    Boolean: variantColors.dark[10],
    String: variantColors.dark[7],
    ObjectId: variantColors.dark[5],
  },
  [Themes.Light]: {
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
  const colorStyle = useMemo(() => {
    if (!type) {
      return;
    }
    return {
      color:
        VALUE_COLOR_BY_THEME_AND_TYPE[darkMode ? Themes.Dark : Themes.Light][
          type
        ],
    };
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
      style={colorStyle}
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
  marginLeft: spacing[100],
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

const toLegacyJavaUUID = ({ value }: PropsByValueType<'Binary'>) => {
  // Get the hex representation from the buffer.
  const hex = Buffer.from(value.buffer).toString('hex');
  // Reverse byte order for Java legacy UUID format (reverse all bytes).
  let msb = hex.substring(0, 16);
  let lsb = hex.substring(16, 32);
  // Reverse pairs of hex characters (bytes).
  msb =
    msb.substring(14, 16) +
    msb.substring(12, 14) +
    msb.substring(10, 12) +
    msb.substring(8, 10) +
    msb.substring(6, 8) +
    msb.substring(4, 6) +
    msb.substring(2, 4) +
    msb.substring(0, 2);
  lsb =
    lsb.substring(14, 16) +
    lsb.substring(12, 14) +
    lsb.substring(10, 12) +
    lsb.substring(8, 10) +
    lsb.substring(6, 8) +
    lsb.substring(4, 6) +
    lsb.substring(2, 4) +
    lsb.substring(0, 2);
  const reversed = msb + lsb;
  const uuid =
    reversed.substring(0, 8) +
    '-' +
    reversed.substring(8, 12) +
    '-' +
    reversed.substring(12, 16) +
    '-' +
    reversed.substring(16, 20) +
    '-' +
    reversed.substring(20, 32);
  return 'LegacyJavaUUID("' + uuid + '")';
};

const toLegacyCSharpUUID = ({ value }: PropsByValueType<'Binary'>) => {
  // Get the hex representation from the buffer.
  const hex = Buffer.from(value.buffer).toString('hex');
  // Reverse byte order for C# legacy UUID format (first 3 groups only).
  const a =
    hex.substring(6, 8) +
    hex.substring(4, 6) +
    hex.substring(2, 4) +
    hex.substring(0, 2);
  const b = hex.substring(10, 12) + hex.substring(8, 10);
  const c = hex.substring(14, 16) + hex.substring(12, 14);
  const d = hex.substring(16, 32);
  const reversed = a + b + c + d;
  const uuid =
    reversed.substring(0, 8) +
    '-' +
    reversed.substring(8, 12) +
    '-' +
    reversed.substring(12, 16) +
    '-' +
    reversed.substring(16, 20) +
    '-' +
    reversed.substring(20, 32);
  return 'LegacyCSharpUUID("' + uuid + '")';
};

const toLegacyPythonUUID = ({ value }: PropsByValueType<'Binary'>) => {
  // Get the hex representation from the buffer.
  const hex = Buffer.from(value.buffer).toString('hex');
  // Python format uses the hex like UUID in subtype 4.
  const uuid =
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20, 32);
  return 'LegacyPythonUUID("' + uuid + '")';
};

// Binary sub_type 3.
const LegacyUUIDValue: React.FunctionComponent<PropsByValueType<'Binary'>> = (
  bsonValue
) => {
  const legacyUUIDDisplayEncoding = useLegacyUUIDDisplayContext();

  const stringifiedValue = useMemo(() => {
    // UUID must be exactly 16 bytes.
    if (bsonValue.value.buffer.length === 16) {
      try {
        if (legacyUUIDDisplayEncoding === 'LegacyJavaUUID') {
          return toLegacyJavaUUID(bsonValue);
        } else if (legacyUUIDDisplayEncoding === 'LegacyCSharpUUID') {
          return toLegacyCSharpUUID(bsonValue);
        } else if (legacyUUIDDisplayEncoding === 'LegacyPythonUUID') {
          return toLegacyPythonUUID(bsonValue);
        }
      } catch {
        // Ignore errors and fallback to the raw representation.
        // The UUID conversion can fail if the binary data is not a valid UUID.
      }
    }

    // Raw, no encoding.
    return `Binary.createFromBase64('${truncate(
      bsonValue.value.toString('base64'),
      100
    )}', ${bsonValue.value.sub_type})`;
  }, [legacyUUIDDisplayEncoding, bsonValue]);

  return (
    <BSONValueContainer type="Binary" title={stringifiedValue}>
      {stringifiedValue}
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
    if (value.sub_type === Binary.SUBTYPE_VECTOR) {
      const vectorType = value.buffer[0];
      if (vectorType === Binary.VECTOR_TYPE.Int8) {
        const truncatedSerializedBuffer = truncate(
          value.toInt8Array().slice(0, 100).join(', '),
          100
        );
        return {
          stringifiedValue: `Binary.fromInt8Array(new Int8Array([${truncatedSerializedBuffer}]))`,
        };
      } else if (vectorType === Binary.VECTOR_TYPE.Float32) {
        const truncatedSerializedBuffer = truncate(
          [...value.toFloat32Array().slice(0, 100)]
            // Using a limited precision and removing trailing zeros for better displaying
            .map((num) => num.toPrecision(8).replace(/\.?0+$/, ''))
            .join(', '),
          100
        );
        return {
          stringifiedValue: `Binary.fromFloat32Array(new Float32Array([${truncatedSerializedBuffer}]))`,
        };
      } else if (vectorType === Binary.VECTOR_TYPE.PackedBit) {
        const truncatedSerializedBuffer = truncate(
          value.toPackedBits().slice(0, 100).join(', '),
          100
        );
        return {
          stringifiedValue: `Binary.fromPackedBits(new Uint8Array([${truncatedSerializedBuffer}]))`,
        };
      }
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
  PropsByValueType<'Int32' | 'Double' | 'Int64' | 'Decimal128'> & {
    type: 'Int32' | 'Double' | 'Int64' | 'Decimal128';
  }
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
      if (props.value.sub_type === Binary.SUBTYPE_UUID_OLD) {
        return <LegacyUUIDValue value={props.value}></LegacyUUIDValue>;
      }
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
