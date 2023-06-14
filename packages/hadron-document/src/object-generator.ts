import type { Element } from './element';
import type { Document } from './document';
import type { BSONArray, BSONObject, BSONValue } from './utils';
import { isEqual } from 'lodash';

const DECRYPTED_KEYS = Symbol.for('@@mdb.decryptedKeys');

export interface ObjectGeneratorOptions {
  excludeInternalFields?: boolean;
}

function maybeDecorateWithDecryptedKeys(
  object: Record<string, unknown> | unknown[],
  element: Element
) {
  if (element.isValueDecrypted()) {
    if (!(object as any)[DECRYPTED_KEYS]) {
      // non-enumerable object[DECRYPTED_KEYS] = []
      Object.defineProperty(object, DECRYPTED_KEYS, {
        value: [],
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
    (object as any)[DECRYPTED_KEYS].push(String(element.currentKey));
  }
}

/** Used to represent missing values, i.e. non-existent fields. */
const DoesNotExist = Symbol('DoesNotExist');

/**
 * Describe a single property of a document. For us, not only the
 * field name, but also whether it is an array index or a regular
 * document property is relevant.
 */
type SubfieldDescription = {
  key: string;
  isArrayIndex: boolean;
};

/**
 * Describe a field in a document, with its path and current value.
 * For example, in the document `{ a: { b: 42 } }`, the nested property
 * `b` of `a` would be described by `{ path: ['a', 'b'], value: 42 }`.
 */
type FieldDescription = {
  path: SubfieldDescription[];
  value: BSONValue | typeof DoesNotExist;
};

export interface KeyInclusionOptions {
  /**
   * An array whose entries are used as keys that are always included
   * in lists for queried keys (e.g. as part of the `find` portion of
   * an update).
   *
   * A nested field for `{ a: { b: 42 } }` would be described by the
   * field path `['a', 'b']`.
   */
  alwaysIncludeKeys?: string[][];

  /**
   * An array whose entries are used as keys that are included in lists
   * for queried keys (e.g. as part of the `find` portion of
   * an update), even when the value of that field has originally been
   * an encrypted value in the sense of CSFLE/QE.
   *
   * A nested field for `{ a: { b: 42 } }` would be described by the
   * field path `['a', 'b']`.
   */
  includableEncryptedKeys?: string[][];
}

/**
 * Generates javascript objects from elements.
 */
export class ObjectGenerator {
  /**
   * Generate a javascript object from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  static generate(
    elements: Iterable<Element>,
    options: ObjectGeneratorOptions = {}
  ): Record<string, unknown> {
    if (elements) {
      const object: Record<string, unknown> = {};
      for (const element of elements) {
        if (options.excludeInternalFields && element.isInternalField()) {
          continue;
        }
        if (!element.isRemoved() && element.currentKey !== '') {
          object[element.currentKey] = element.generateObject(options);
          maybeDecorateWithDecryptedKeys(object, element);
        }
      }
      return object;
    }
    return elements;
  }

  /**
   * Generate a javascript object from the elements with their original keys
   * and values. This can be used in a query with an update to
   * ensure the values on the document to edit are still up to date.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  static generateOriginal(
    elements: Iterable<Element>,
    options: ObjectGeneratorOptions = {}
  ): Record<string, unknown> {
    if (elements) {
      const object: Record<string, unknown> = {};
      for (const element of elements) {
        if (options.excludeInternalFields && element.isInternalField()) {
          continue;
        }
        if (!element.isAdded()) {
          object[element.key] = element.generateOriginalObject(options);
          maybeDecorateWithDecryptedKeys(object, element);
        }
      }
      return object;
    }
    return elements;
  }

  /**
   * Generate an array from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  static generateArray(
    elements: Iterable<Element>,
    options: ObjectGeneratorOptions = {}
  ): unknown[] {
    if (elements) {
      const array: unknown[] = [];
      for (const element of elements) {
        if (options.excludeInternalFields && element.isInternalField()) {
          continue;
        }
        if (!element.isRemoved()) {
          if (element.elements) {
            array.push(element.generateObject(options));
          } else {
            array.push(element.currentValue);
          }
          maybeDecorateWithDecryptedKeys(array, element);
        }
      }
      return array;
    }
    return elements;
  }

  /**
   * Generate an array from the elements using their original values.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  static generateOriginalArray(
    elements: Iterable<Element>,
    options: ObjectGeneratorOptions = {}
  ): unknown[] {
    if (elements) {
      const array: unknown[] = [];
      for (const element of elements) {
        if (options.excludeInternalFields && element.isInternalField()) {
          continue;
        }
        if (element.originalExpandableValue) {
          array.push(element.generateOriginalObject(options));
        } else if (!element.isAdded()) {
          array.push(element.value);
        }
        maybeDecorateWithDecryptedKeys(array, element);
      }
      return array;
    }
    return elements;
  }

  /**
   * As the first step in generating query and update documents for updated
   * fields in a document, gather the original and new paths and values
   * for those updated fields.
   *
   * @param target The target document, or, when recursing, element.
   * @param keyInclusionOptions Specify which fields to include in the
   *     originalFields list.
   * @param includeUpdatedFields Whether to include original and new values
   *     of updated fields. If set to `false`, only fields included in
   *     @see alwaysIncludeOriginalKeys are included.
   * @returns A pair `{ originalFields, newFields }`, each listing the
   *     original and new paths and values for updated fields, respectively.
   */
  private static recursivelyGatherFieldsAndValuesForUpdate(
    target: Document | Element,
    keyInclusionOptions: Readonly<KeyInclusionOptions>,
    includeUpdatedFields: boolean
  ): {
    originalFields: FieldDescription[];
    newFields: FieldDescription[];
  } {
    const originalFields: FieldDescription[] = [];
    const newFields: FieldDescription[] = [];
    const alwaysIncludeKeys = keyInclusionOptions.alwaysIncludeKeys ?? [];
    const includableEncryptedKeys =
      keyInclusionOptions.includableEncryptedKeys ?? [];

    for (const element of target.elements ?? []) {
      const isArrayIndex = target.currentType === 'Array';
      // Do not include encrypted fields in the `originalFields` list
      // unless we know that it is okay to include them (i.e. because
      // we know that we can perform equality queries on those fields).
      const canIncludeOriginalValue =
        !element.isValueDecrypted() ||
        includableEncryptedKeys.some(
          (key) => key.length === 1 && key[0] === String(element.key)
        );

      // Recurse into an element if it either has been updated and we are looking
      // for updated fields, or it is part of the set of keys that we should always
      // include.
      if (
        (includeUpdatedFields &&
          element.isModified() &&
          !element.isAdded() &&
          !element.hasChangedKey()) ||
        alwaysIncludeKeys.some((key) => key[0] === String(element.key))
      ) {
        // Two possible cases: Either we recurse into this element and change
        // nested values, or we replace the element entirely.
        // We can only recurse if:
        // - This is a nested element with children, i.e. array or document
        // - It was not explicitly requested via alwaysIncludeKeys to
        //   always include it in its entirety
        // - Its type has not changed
        // - It is not an array with removed elements, since MongoDB has
        //   no way to remove individual array elements (!!) prior to
        //   agg-pipeline-style updates added in 4.2, and even then it's complex
        //   to actually do so
        if (
          element.elements &&
          !alwaysIncludeKeys.some(
            (key) => key.length === 1 && key[0] === String(element.key)
          ) &&
          ((element.type === 'Object' && element.currentType === 'Object') ||
            (element.type === 'Array' &&
              element.currentType === 'Array' &&
              !element.hasAnyRemovedChild()))
        ) {
          // Nested case: Translate keyInclusionOptions to the nested keys,
          // get the original keys and values for the nested element,
          // then translate the result back to this level.
          const filterAndShiftFieldPaths = (paths: string[][]) =>
            paths
              .filter((key) => key[0] === String(element.key))
              .map((key) => key.slice(1))
              .filter((key) => key.length > 0);
          const nestedKeyInclusionOptions: KeyInclusionOptions = {
            alwaysIncludeKeys: filterAndShiftFieldPaths(alwaysIncludeKeys),
            includableEncryptedKeys: filterAndShiftFieldPaths(
              includableEncryptedKeys
            ),
          };
          const nestedResult =
            ObjectGenerator.recursivelyGatherFieldsAndValuesForUpdate(
              element,
              nestedKeyInclusionOptions,
              includeUpdatedFields
            );
          for (const { path, value } of nestedResult.originalFields) {
            originalFields.push({
              path: [{ key: String(element.key), isArrayIndex }, ...path],
              value,
            });
          }
          for (const { path, value } of nestedResult.newFields) {
            newFields.push({
              path: [
                { key: String(element.currentKey), isArrayIndex },
                ...path,
              ],
              value,
            });
          }
        } else {
          // Using `.key` instead of `.currentKey` to ensure we look at
          // the original field's value.
          if (canIncludeOriginalValue) {
            originalFields.push({
              path: [{ key: String(element.key), isArrayIndex }],
              value: element.generateOriginalObject(),
            });
          }

          if (
            includeUpdatedFields &&
            element.currentKey !== '' &&
            !element.isRemoved()
          ) {
            newFields.push({
              path: [{ key: String(element.currentKey), isArrayIndex }],
              value: element.generateObject(),
            });
          }
        }
      }

      if (
        includeUpdatedFields &&
        !element.isRemoved() &&
        (element.isAdded() || element.hasChangedKey()) &&
        element.currentKey !== ''
      ) {
        // When a new field is added, check if the original value of that
        // field (which is typically that it was missing) was changed in
        // the background. If there *was* another field in its place,
        // that means that it was removed, and is added to `originalValue`
        // at another point.
        let wasRenamedToKeyOfPreviouslyExistingElement = false;
        for (const otherElement of target.elements ?? []) {
          if (
            otherElement !== element &&
            otherElement.key === element.currentKey
          ) {
            wasRenamedToKeyOfPreviouslyExistingElement = true;
            break;
          }
        }
        if (!wasRenamedToKeyOfPreviouslyExistingElement) {
          originalFields.push({
            path: [{ key: String(element.currentKey), isArrayIndex }],
            value: DoesNotExist,
          });
        }
        newFields.push({
          path: [{ key: String(element.currentKey), isArrayIndex }],
          value: element.generateObject(),
        });
      }

      if (
        includeUpdatedFields &&
        !element.isAdded() &&
        (element.isRemoved() || element.hasChangedKey()) &&
        element.key !== ''
      ) {
        // Remove the original field when an element is removed or renamed.
        if (canIncludeOriginalValue) {
          originalFields.push({
            path: [{ key: String(element.key), isArrayIndex }],
            value: element.generateOriginalObject(),
          });
        }

        let wasRemovedAndLaterReplacedByNewElement = false;
        for (const otherElement of target.elements ?? []) {
          if (
            otherElement !== element &&
            otherElement.currentKey === element.key
          ) {
            wasRemovedAndLaterReplacedByNewElement = true;
            break;
          }
        }
        if (!wasRemovedAndLaterReplacedByNewElement) {
          newFields.push({
            path: [{ key: String(element.key), isArrayIndex }],
            value: DoesNotExist,
          });
        }
      }
    }

    // Sometimes elements are removed or renamed, and then another
    // element is added or renamed to take its place. We filter out
    // the DoesNotExist entry for that case.
    for (let i = 0; i < newFields.length; ) {
      const entry = newFields[i];
      if (entry.value === DoesNotExist) {
        if (
          newFields.some(
            (otherEntry) =>
              isEqual(otherEntry.path, entry.path) && entry !== otherEntry
          )
        ) {
          // Drop `entry`.
          newFields.splice(i, 1);
          continue;
        }
      }
      i++;
    }

    return { originalFields, newFields };
  }

  // Return a $getField expression that evaluates to the current value
  // of the document at `path`.
  private static createGetFieldExpr(path: SubfieldDescription[]): BSONObject {
    return path.reduce(
      (input, { key, isArrayIndex }) =>
        isArrayIndex
          ? {
              $arrayElemAt: [input, +key],
            }
          : {
              $getField: {
                field: { $literal: key },
                input,
              },
            },
      '$$ROOT' as any
    );
  }

  // Return a $setField expression that writes the specified value
  // to the document at `path`.
  private static createSetFieldExpr(
    path: SubfieldDescription[],
    value: BSONValue | typeof DoesNotExist
  ): BSONValue {
    return path.reduceRight((value, { key, isArrayIndex }, idx, array) => {
      const input = ObjectGenerator.createGetFieldExpr(array.slice(0, idx));
      if (!isArrayIndex) {
        // 'Simple' case: Change a property of a document
        return {
          $setField: {
            field: { $literal: key },
            input,
            value,
          },
        };
      }

      // Array case: concatenate the prefix of the array before the changed
      // index, an array containing the new value at the changed index,
      // and the suffix afterwards; use $let to avoid specifying the full
      // input value expression multiple times.
      return {
        $let: {
          vars: { input },
          in: {
            $concatArrays: [
              // The third argument to $slice must not be 0
              ...(+key > 0 ? [{ $slice: ['$$input', 0, +key] }] : []),
              [value],
              // The third argument is required; 2^31-1 is the maximum
              // accepted value, and well beyond what BSON can represent.
              { $slice: ['$$input', +key + 1, 2 ** 31 - 1] },
            ],
          },
        },
      };
    }, (value === DoesNotExist ? '$$REMOVE' : { $literal: value }) as any);
  }

  /**
   * Generate the query javascript object reflecting original
   * values of specific elements in this documents. This can include
   * elements that were updated in this document. In that case, the
   * values of this object are the original values, this can be used
   * when querying for an update to see if the original document was
   * changed in the background while it was being updated elsewhere.
   *
   * NOTE: `alwaysIncludeKeys` is currently used for sharding, since
   * updates on sharded setups need to include the shard key in their
   * find part. https://jira.mongodb.org/browse/PM-1632 will make
   * this requirement go away for future MongoDB versions!
   *
   * @param target The target (sub-)document.
   * @param keyInclusionOptions Specify which fields to include in the
   *     originalFields list.
   * @param includeUpdatedFields Whether to include the original values for
   *     updated fields.
   *
   * @returns A pair of lists, one containing the original values for updated fields
   *     or those specified in the always-include list, and one containing new values
   *     of the updated fields. If includeUpdatedFields is not set, the second
   *     list will be empty.
   */
  static getQueryForOriginalKeysAndValuesForSpecifiedFields(
    target: Document | Element,
    keyInclusionOptions: Readonly<KeyInclusionOptions>,
    includeUpdatedFields: boolean
  ): BSONObject {
    const { originalFields } =
      ObjectGenerator.recursivelyGatherFieldsAndValuesForUpdate(
        target,
        keyInclusionOptions,
        includeUpdatedFields
      );

    const query: any = {};
    if (
      originalFields.some(({ path }) =>
        path.some(({ key }) => key.includes('.') || key.startsWith('$'))
      )
    ) {
      // Some of the keys in this query are only accesible via $getField,
      // which was introduced in MongoDB 5.0.
      const equalityMatches: any[] = [];
      for (const { path, value } of originalFields) {
        const getFieldExpr = ObjectGenerator.createGetFieldExpr(path);
        equalityMatches.push(
          value !== DoesNotExist
            ? { $eq: [getFieldExpr, { $literal: value }] }
            : { $eq: [{ $type: getFieldExpr }, 'missing'] }
        );
      }
      if (equalityMatches.length === 1) {
        query.$expr = equalityMatches[0];
      } else if (equalityMatches.length > 1) {
        query.$expr = { $and: equalityMatches };
      }
    } else {
      for (const { path, value } of originalFields) {
        const matchValue = value === DoesNotExist ? { $exists: false } : value;
        query[path.map(({ key }) => key).join('.')] = matchValue;
      }
    }
    return query;
  }

  /**
   * Generate an update document or pipeline which reflects the updates
   * that have taken place for this document. A pipeline will be returned
   * if the updates require changes to fields containing dots or prefixed
   * with $.
   *
   * @param target The target (sub-)document.
   */
  static generateUpdateDoc(
    target: Document | Element
  ): { $set?: BSONObject; $unset?: BSONObject } | BSONArray {
    const { newFields } =
      ObjectGenerator.recursivelyGatherFieldsAndValuesForUpdate(
        target,
        {},
        true
      );

    if (
      newFields.some(({ path }) =>
        path.some(({ key }) => key.includes('.') || key.startsWith('$'))
      )
    ) {
      // Some of the keys in this query are only writable via $setField/$unsetField,
      // which was introduced in MongoDB 5.0. In this case we can use pipeline-style updates.
      return newFields.map(({ path, value }) => {
        return {
          $replaceWith: ObjectGenerator.createSetFieldExpr(path, value),
        };
      });
    } else {
      const updateDoc: { $set?: BSONObject; $unset?: BSONObject } = {};
      for (const { path, value } of newFields) {
        if (value === DoesNotExist) {
          updateDoc.$unset ??= {};
          updateDoc.$unset[path.map(({ key }) => key).join('.')] = true;
        } else {
          updateDoc.$set ??= {};
          updateDoc.$set[path.map(({ key }) => key).join('.')] = value;
        }
      }
      return updateDoc;
    }
  }
}

export default ObjectGenerator;
