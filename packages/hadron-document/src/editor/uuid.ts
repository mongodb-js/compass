import TypeChecker from 'hadron-type-checker';
import { Binary } from 'bson';
import { ElementEvents } from '../element-events';
import StandardEditor from './standard';
import type { Element } from '../element';
import { UUID_TYPES, type UUIDType } from '../element';
import type { BSONValue } from '../utils';

/**
 * Converts a hex string to UUID format with hyphens.
 */
const toUUIDWithHyphens = (hex: string): string => {
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20, 32)
  );
};

/**
 * Converts a Binary UUID (subtype 4) to a UUID string with hyphens.
 */
const binaryToUUIDString = (binary: Binary): string => {
  try {
    return binary.toUUID().toString();
  } catch {
    // Fallback to hex if toUUID fails
    return Buffer.from(binary.buffer).toString('hex');
  }
};

/**
 * Converts a Binary Legacy Java UUID (subtype 3) to a UUID string with hyphens.
 * Java legacy format reverses byte order for both MSB and LSB.
 */
const binaryToLegacyJavaUUIDString = (binary: Binary): string => {
  const hex = Buffer.from(binary.buffer).toString('hex');
  let msb = hex.substring(0, 16);
  let lsb = hex.substring(16, 32);
  // Reverse pairs of hex characters (bytes) for both MSB and LSB.
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
  return toUUIDWithHyphens(msb + lsb);
};

/**
 * Converts a Binary Legacy C# UUID (subtype 3) to a UUID string with hyphens.
 * C# legacy format reverses byte order for first 3 groups only.
 */
const binaryToLegacyCSharpUUIDString = (binary: Binary): string => {
  const hex = Buffer.from(binary.buffer).toString('hex');
  const a =
    hex.substring(6, 8) +
    hex.substring(4, 6) +
    hex.substring(2, 4) +
    hex.substring(0, 2);
  const b = hex.substring(10, 12) + hex.substring(8, 10);
  const c = hex.substring(14, 16) + hex.substring(12, 14);
  const d = hex.substring(16, 32);
  return toUUIDWithHyphens(a + b + c + d);
};

/**
 * Converts a Binary Legacy Python UUID (subtype 3) to a UUID string with hyphens.
 * Python legacy format uses direct byte order (no reversal).
 */
const binaryToLegacyPythonUUIDString = (binary: Binary): string => {
  const hex = Buffer.from(binary.buffer).toString('hex');
  return toUUIDWithHyphens(hex);
};

/**
 * CRUD editor for UUID values (Binary subtypes 3 and 4).
 */
export default class UUIDEditor extends StandardEditor {
  uuidType: UUIDType;

  constructor(element: Element) {
    super(element);
    this.uuidType = (UUID_TYPES as readonly string[]).includes(
      element.currentType
    )
      ? (element.currentType as UUIDType)
      : 'UUID';
  }

  /**
   * Get the value being edited as a UUID string.
   */
  value(): string {
    const val = this.element.currentValue;
    // If already a string (during editing), return as is
    if (typeof val === 'string') {
      return val;
    }
    // If it's a Binary, convert to UUID string based on the type
    if (val instanceof Binary) {
      switch (this.uuidType) {
        case 'LegacyJavaUUID':
          return binaryToLegacyJavaUUIDString(val);
        case 'LegacyCSharpUUID':
          return binaryToLegacyCSharpUUIDString(val);
        case 'LegacyPythonUUID':
          return binaryToLegacyPythonUUIDString(val);
        case 'UUID':
        default:
          return binaryToUUIDString(val);
      }
    }
    return String(val);
  }

  /**
   * Edit the element with the provided value.
   */
  edit(value: BSONValue): void {
    try {
      TypeChecker.cast(value, this.uuidType);
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(ElementEvents.Edited, this.element);
    } catch (e: any) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Start the UUID edit - convert Binary to string for editing.
   */
  start(): void {
    super.start();
    if (this.element.isCurrentTypeValid()) {
      this.edit(this.value());
    }
  }

  /**
   * Complete the UUID edit by converting the valid string back to Binary.
   */
  complete(): void {
    super.complete();
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(
        TypeChecker.cast(this.element.currentValue, this.uuidType)
      );
    }
  }
}
