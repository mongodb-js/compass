
/**
 * Generate an $set javascript object, that can be used in update operations to
 * set the changes which have occured in the document since it was loaded.
 *
 * @param {Document} doc - The hadron document.
 *
 * @returns {Object} The javascript update object.
**/
export const getSetUpdateForDocumentChanges = (doc) => {
  const object = {};

  if (doc && doc.elements) {
    for (const element of doc.elements) {
      if (
        !element.isRemoved()
        && element.currentKey !== ''
        && element.isModified()
      ) {
        // Include the full modified element.
        // We don't individually set nested fields because we can't guarantee a
        // path to the element using '.' dot notation will update
        // the correct field, because field names can contain dots as of 3.6.
        // When a nested field has been altered (changed/added/removed) it is
        // set at the top level field. This means we overwrite possible
        // background changes that occur within sub documents.
        object[element.currentKey] = element.generateObject();
      }
    }
  }
  return object;
};

/**
 * Generate an $unset javascript object, that can be used in update
 * operations, with the removals from the document.
 *
 * @param {Document} doc - The hadron document.
 *
 * @returns {Object} The javascript update object.
**/
export const getUnsetUpdateForDocumentChanges = (doc) => {
  const object = {};

  if (doc && doc.elements) {
    for (const element of doc.elements) {
      if (!element.isAdded() && element.isRemoved() && element.key !== '') {
        object[element.key] = true;
      }
      if (!element.isAdded() && element.isRenamed() && element.key !== '') {
        // Remove the original field when an element is renamed.
        object[element.key] = true;
      }
    }
  }
  return object;
};

/**
 * Generate the query javascript object reflecting the elements that
 * were updated in this document. The values of this object are the original
 * values, this can be used when querying for an update to see if the original
 * document was changed in the background while it was being updated elsewhere.
 *
 * @param {Object} doc - The hadron document.
 * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
 *     that are always included in the generated query.
 *
 * @returns {Object} The javascript object.
 */
export const getOriginalKeysAndValuesForFieldsThatWereUpdated = (doc, alwaysIncludeKeys = null) => {
  const object = {};

  if (doc && doc.elements) {
    for (const element of doc.elements) {
      if ((element.isModified() && !element.isAdded()) ||
          (alwaysIncludeKeys && element.key in alwaysIncludeKeys)) {
        // Using `.key` instead of `.currentKey` to ensure we look at
        // the original field's value.
        object[element.key] = element.generateOriginalObject();
      }
      if (element.isAdded() && element.currentKey !== '') {
        // When a new field is added, check if that field
        // was already added in the background.
        object[element.currentKey] = { $exists: false };
      }
    }
  }

  return object;
};

/**
 * Generate the query javascript object reflecting the elements that
 * are specified by the keys listed in `keys`. The values of this object are
 * the original values, this can be used when querying for an update based
 * on multiple criteria.
 *
 * @param {Object} doc - The hadron document.
 * @param {Object} keys - An object whose keys are used as keys
 *     that are included in the generated query.
 *
 * @returns {Object} The javascript object.
 */
export const getOriginalKeysAndValuesForSpecifiedKeys = (doc, keys) => {
  const object = {};

  if (doc && doc.elements) {
    for (const element of doc.elements) {
      if (element.key in keys) {
        // Using `.key` instead of `.currentKey` to ensure we look at
        // the original field's value.
        object[element.key] = element.generateOriginalObject();
      }
    }
  }

  return object;
};

/**
 * Generate the `query` and `updateDoc` to be used in an update operation
 * where the update only succeeds when the changed document's elements have
 * not been changed in the background.
 *
 * @param {Object} doc - The hadron document.
 * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
 *     that are always included in the generated query.
 *
 * @returns {Object} An object containing the `query` and `updateDoc` to be
 * used in an update operation.
 */
export const buildUpdateUnlessChangedInBackgroundQuery = (doc, alwaysIncludeKeys = null) => {
  // Build a query that will find the document to update only if it has the
  // values of elements that were changed with their original value.
  // This query won't find the document if an updated element's value isn't
  // the same value as it was when it was originally loaded.
  const originalFieldsThatWillBeUpdated = getOriginalKeysAndValuesForFieldsThatWereUpdated(doc, alwaysIncludeKeys);
  const query = {
    _id: doc.getId(),
    ...originalFieldsThatWillBeUpdated
  };

  // Build the update document to be used in an update operation with `$set`
  // and `$unset` reflecting the changes that have occured in the document.
  const setUpdateObject = getSetUpdateForDocumentChanges(doc);
  const unsetUpdateObject = getUnsetUpdateForDocumentChanges(doc);
  const updateDoc = { };
  if (setUpdateObject && Object.keys(setUpdateObject).length > 0) {
    updateDoc.$set = setUpdateObject;
  }
  if (unsetUpdateObject && Object.keys(unsetUpdateObject).length > 0) {
    updateDoc.$unset = unsetUpdateObject;
  }

  return {
    query,
    updateDoc
  };
};
