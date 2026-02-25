import TypeChecker, {
  uuidHexToString,
  reverseJavaUUIDBytes,
  reverseCSharpUUIDBytes,
  getBsonType,
} from 'hadron-type-checker';
import type { Binary } from 'bson';
import { ElementEvents } from '../element-events';
import StandardEditor from './standard';
import type { Element } from '../element';
import { isUUIDType, type UUIDType } from '../element';
import type { BSONValue } from '../utils';

/**
 * Converts a Binary UUID (subtype 4) to a UUID string with hyphens.
 */
const binaryToUUIDString = (binary: Binary): string => {
  try {
    return binary.toUUID().toString();
  } catch {
    // Fallback to hex if toUUID fails
    return binary.toString('hex');
  }
};

/**
 * Converts a Binary Legacy Java UUID (subtype 3) to a UUID string with hyphens.
 * Java legacy format reverses byte order for both MSB and LSB.
 */
const binaryToLegacyJavaUUIDString = (binary: Binary): string => {
  const hex = binary.toString('hex');
  const reversedHex = reverseJavaUUIDBytes(hex);
  return uuidHexToString(reversedHex);
};

/**
 * Converts a Binary Legacy C# UUID (subtype 3) to a UUID string with hyphens.
 * C# legacy format reverses byte order for first 3 groups only.
 */
const binaryToLegacyCSharpUUIDString = (binary: Binary): string => {
  const hex = binary.toString('hex');
  const reversedHex = reverseCSharpUUIDBytes(hex);
  return uuidHexToString(reversedHex);
};

/**
 * Converts a Binary Legacy Python UUID (subtype 3) to a UUID string with hyphens.
 * Python legacy format uses direct byte order (no reversal).
 */
const binaryToLegacyPythonUUIDString = (binary: Binary): string => {
  const hex = binary.toString('hex');
  return uuidHexToString(hex);
};

/**
 * CRUD editor for UUID values (Binary subtypes 3 and 4).
 */
export default class UUIDEditor extends StandardEditor {
  uuidType: UUIDType;

  /**
   * Create the UUID editor.
   *
   * @param element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
    // Use element.displayType if set and it's a UUID type, otherwise fall back to element.currentType
    const effectiveType = element.displayType ?? element.currentType;
    this.uuidType = isUUIDType(effectiveType) ? effectiveType : 'UUID';
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
    if (getBsonType(val) === 'Binary') {
      const binary = val as Binary;
      switch (this.uuidType) {
        case 'LegacyJavaUUID':
          return binaryToLegacyJavaUUIDString(binary);
        case 'LegacyCSharpUUID':
          return binaryToLegacyCSharpUUIDString(binary);
        case 'LegacyPythonUUID':
          return binaryToLegacyPythonUUIDString(binary);
        case 'UUID':
        default:
          return binaryToUUIDString(binary);
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
      // Update the currentType to the UUID type so the UI displays correctly
      // This is needed because the element may have been created with currentType='Binary'
      // but we want to edit it as a UUID type
      this.element.currentType = this.uuidType;
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
      // Preserve the UUID type since element.edit() sets currentType to 'Binary'
      // for Binary values (TypeChecker.type() returns 'Binary' for Binary objects)
      this.element.currentType = this.uuidType;
    }
  }
}
