import assert from 'assert';
import type { Delta } from 'jsondiffpatch';
import * as jsondiffpatch from 'jsondiffpatch';

import { type Document } from 'bson';

import { stringifyBSON, unBSON } from './bson-utils';
import { isSimpleObject, getValueShape } from './shape-utils';

const differ = jsondiffpatch.create({
  arrays: {
    // Array moves are really complicated to visualise both technically and also
    // usability-wise. (see jsondiffpatch's demo). With this set to false array
    // changes will be separate removes and adds.
    detectMove: false,
  },
  textDiff: {
    // Technically this doesn't matter anymore now that we look up the value out
    // of before/after docs, but there are nicer ways to diff larger blocks of
    // text. Although we probably won't bother with diffing text fields for our
    // use case.
    minLength: Infinity, // don't do a text diff on bson values
  },
  objectHash: function (obj: any) {
    // Probably not the most efficient, but gets the job done. This is used by
    // jsondiffpatch when diffing arrays that contain objects to be able to
    // determine which objects in the left and right docs are the same ones.
    return stringifyBSON(obj);
  },
});

export type ObjectPath = (string | number)[];

type ChangeType = 'unchanged' | 'changed' | 'added' | 'removed';

export type UnifiedBranch = {
  implicitChangeType: ChangeType;
  delta: Delta | null;
} & (
  | { left: Branch; right: Branch; changeType: 'changed' | 'unchanged' }
  | { left?: never; right: Branch; changeType: 'added' }
  | { left: Branch; right?: never; changeType: 'removed' }
);

// Only the root object, really. otherwise it will be ObjectPropertyBranch
// or ObjectItemBranch
export type ObjectBranch = UnifiedBranch & {
  properties: PropertyBranch[];
};

// Either an ArrayPropertyBranch or an ArrayItemBranch
// { foo: [ /* this */ ] }
// { foo: [[ /* this */ ]] }
export type ArrayBranch = UnifiedBranch & {
  items: ItemBranch[];
};

// Either an ObjectPropertyBranch or an ArrayPropertyBranch ir just a PropertyBranch
// { foo: { /* this */ }}
// { foo: [ /* this */ ]}
// { foo: /*  any simple value here */ }
export type PropertyBranch = UnifiedBranch & {
  objectKey: string;
};

// { foo: { /* this */ } }
export type ObjectPropertyBranch = UnifiedBranch & {
  objectKey: string;
  properties: PropertyBranch[];
};

// { foo: [ /* this */ ] }
export type ArrayPropertyBranch = UnifiedBranch & {
  objectKey: string;
  items: ItemBranch[];
};

// Either an ObjectItemBranch or an ArrayItemBranch or just an ItemBranch
// { foo: [{ /* this */ }]}
// { foo: [[ /* this */ ]]}
// { foo: [/*  any simple value here */ ]}
export type ItemBranch = UnifiedBranch & {
  index: number;
};

// { foo: [{ /* this */ }]}
export type ObjectItemBranch = UnifiedBranch & {
  index: number;
  properties: PropertyBranch[];
};

// { foo: [[ /* this */ ]]}
export type ArrayItemBranch = UnifiedBranch & {
  index: number;
  items: ItemBranch[];
};

export type Branch = {
  path: ObjectPath;
  value: any | any[];
};

export type BranchesWithChanges = {
  delta: Delta | null; // delta is null for unchanged branches
  implicitChangeType: ChangeType;
} & (
  | { left: Branch; right: Branch } // changed | unchanged
  | { left?: never; right: Branch } // added
  | { left: Branch; right?: never }
); // removed

function propertiesWithChanges({
  left,
  right,
  delta,
  implicitChangeType,
}: BranchesWithChanges) {
  // For unchanged, changed or removed objects we use the left value, otherwise
  // we use the right value because that's the only one available. ie. we
  // descend down a branch of green added stuff and render that even though
  // there's no "left/before" data matching it. For red removed branches we
  // still use the left/before data.
  const value =
    implicitChangeType === 'added'
      ? (right as Branch).value
      : (left as Branch).value;

  const properties = Object.entries(value).map(
    ([objectKey, leftValue]): PropertyBranch => {
      const prop = {
        implicitChangeType,
        objectKey,
        // We'll fill in delta below if this is an unchanged object with changes
        // somewhere inside it.
        // ie. { foo: {} } => foo: { bar: 'baz' }. foo's value is "unchanged"
        // itself, but it has a delta because bar inside it changed.
        delta: null,
      };

      // For both of these: if there is a left/right path we use that. Otherwise
      // we're in an added/removed branch so there is no corresponding left/right
      // path. (So you can have left or right or both)
      const newLeft: Branch | undefined = left
        ? {
            path: [...left.path, objectKey],
            value: leftValue,
          }
        : undefined;

      // This is just the case where the value was unchanged. changed, added and
      // removed get handled below, overriding these values.
      const newRight: Branch | undefined = right
        ? {
            path: [...right.path, objectKey],
            value: right.value[objectKey],
          }
        : undefined;

      if (newLeft && newRight) {
        return {
          ...prop,
          changeType: 'unchanged', // might change to changed below
          left: newLeft,
          right: newRight,
        };
      } else if (newLeft) {
        return {
          ...prop,
          changeType: 'removed',
          left: newLeft,
        };
      } else if (newRight) {
        return {
          ...prop,
          changeType: 'added',
          right: newRight,
        };
      } else {
        throw new Error('left or right required or both');
      }
    }
  );

  if (delta) {
    assert(isSimpleObject(delta), 'delta should be a simple object');
    for (const [key, change] of Object.entries(delta)) {
      /*
      delta = {
        property1: [ rightValue1 ], // obj[property1] = rightValue1
        property2: [ leftValue2, rightValue2 ], // obj[property2] = rightValue2 (and previous value was leftValue2)
        property5: [ leftValue5, 0, 0 ] // delete obj[property5] (and previous value was leftValue5)
      }
      */
      if (Array.isArray(change)) {
        if (change.length === 1) {
          // add
          properties.push({
            implicitChangeType,
            changeType: 'added',
            objectKey: key,
            // NOTE: no leftValue or leftPath
            right: {
              path: [...(right as Branch).path, key], // right must exist because we're adding
              value: change[0],
            },
            delta: null,
          });
        } else if (change.length === 2) {
          // update
          const existingProperty = properties.find((p) => p.objectKey === key);
          if (existingProperty) {
            // This assignment might be pointless because we already initialised
            // the property with the right value above, but just keep it for
            // completeness' sake.
            // 0 is the old (left) value, 1 is the new (right) value
            (existingProperty.right as Branch).value = change[1]; // right must exist because this is a change
            existingProperty.changeType = 'changed';
          } else {
            assert(false, `property with key "${key} does not exist"`);
          }
        } else if (change.length === 3) {
          // delete
          const existingProperty = properties.find((p) => p.objectKey === key);
          if (existingProperty) {
            existingProperty.changeType = 'removed';
            delete existingProperty.right;
          } else {
            assert(false, `property with key "${key} does not exist"`);
          }
        } else {
          assert(false, 'unexpected change length');
        }
      } else {
        assert(isSimpleObject(change), 'change should be a simple object');
        // unchanged, so we pass the delta along as there are changes deeper in
        // the branch
        const existingProperty = properties.find((p) => p.objectKey === key);
        if (existingProperty) {
          existingProperty.delta = change;
        } else {
          assert(false, `property with key "${key} does not exist"`);
        }
      }
    }
  }

  // Turn changes where the "shape" (ie. array, object or leaf) changed into
  // remove followed by add because we can't easily visualise it on one line
  let changed = true;
  while (changed) {
    changed = false;
    const index = properties.findIndex((property) => {
      if (property.changeType === 'changed') {
        const beforeType = getValueShape(property.left.value);
        const afterType = getValueShape(property.right.value);
        if (beforeType !== afterType) {
          return true;
        }
      }
      return false;
    });
    if (index !== -1) {
      const property = properties[index];
      changed = true;
      const deleteProperty = {
        implicitChangeType,
        changeType: 'removed' as const,
        objectKey: property.objectKey,
        left: property.left as Branch,
        delta: null,
      };

      const addProperty = {
        implicitChangeType,
        changeType: 'added' as const,
        objectKey: property.objectKey,
        right: {
          // both exist because we just checked it above
          path: (property.left as Branch).path,
          value: (property.right as Branch).value,
        },
        delta: null,
      };
      properties.splice(index, 1, deleteProperty, addProperty);
    }
  }

  for (const property of properties) {
    const value =
      property.changeType === 'added'
        ? property.right.value
        : property.left.value;
    const shape = getValueShape(value);
    if (shape === 'array') {
      (property as ArrayPropertyBranch).items = itemsWithChanges({
        left: property.left ?? undefined,
        right: property.right ?? undefined,
        delta: property.delta,
        implicitChangeType: getImplicitChangeType(property),
      } as BranchesWithChanges);
    } else if (shape === 'object') {
      (property as ObjectPropertyBranch).properties = propertiesWithChanges({
        left: property.left ?? undefined,
        right: property.right ?? undefined,
        delta: property.delta,
        implicitChangeType: getImplicitChangeType(property),
      } as BranchesWithChanges);
    }
  }

  return properties;
}

function itemsWithChanges({
  left,
  right,
  delta,
  implicitChangeType,
}: BranchesWithChanges) {
  // Same reasoning here as for propertiesWithChanges
  const value = (
    implicitChangeType === 'added'
      ? (right as Branch).value
      : (left as Branch).value
  ) as any[];

  const items = value.map((leftValue, index): ItemBranch => {
    const item = {
      implicitChangeType,
      index,
      // Array changes don't work like object changes where it is possible for a
      // property to have changes that are deeper down. All changes are adds or
      // removes, so no delta to pass down to lower levels.
      delta: null,
    };

    // For both of these: if there is a left/right path we use that. Otherwise
    // we're in an added/removed branch so there is no corresponding left/right
    // path. (So you can have left or right or both)
    const newLeft: Branch | undefined = left
      ? {
          path: [...left.path, index],
          value: leftValue,
        }
      : undefined;

    // This is just the case where the value was unchanged. changed, added and
    // removed get handled below, overriding these values.
    const newRight: Branch | undefined = right
      ? {
          path: [...right.path, index],
          // assume the value is unchanged, fix below if it was removed. Arrays
          // don't have changes.
          value: leftValue,
        }
      : undefined;

    if (newLeft && newRight) {
      return {
        ...item,
        changeType: 'unchanged',
        left: newLeft,
        right: newRight,
      };
    } else if (newLeft) {
      return {
        ...item,
        changeType: 'removed',
        left: newLeft,
      };
    } else if (newRight) {
      return {
        ...item,
        changeType: 'added',
        right: newRight,
      };
    } else {
      throw new Error('left or right required or both');
    }
  });

  if (delta) {
    /*
    delta = {
      _t: 'a',
      index1: innerDelta1,
      index2: innerDelta2,
      index5: innerDelta5,
    };
    */
    assert(delta._t === 'a', 'delta._t is not a');
    const toRemove = Object.keys(delta)
      .filter((key) => key.startsWith('_') && key !== '_t')
      .map((key) => parseInt(key.slice(1), 10));

    // Removed indexes refer to the original (left) which is why we remove in a
    // separate pass before updating/adding
    for (const index of toRemove) {
      // removed
      const existingItem = items[index];
      if (existingItem) {
        existingItem.changeType = 'removed';
        delete existingItem.right;
      } else {
        assert(false, `item with index "${index}" does not exist`);
      }

      // adjust the indexes of all items after this one
      for (const item of items) {
        if (item.index > index) {
          item.index = item.index - 1;
        }
      }
    }

    for (const [_index, change] of Object.entries(delta)) {
      if (_index.startsWith('_')) {
        // already handled
        continue;
      } else {
        // Non-removed indexes refer to the final (right) array which is why we
        // update/add in a separate pass after removing

        const index = parseInt(_index, 10);
        assert(Array.isArray(change), 'unexpected non-array');
        assert(change.length !== 3, 'array moves are not supported');
        assert(change.length !== 2, 'array changes are not supported'); // always add and remove

        // added

        // adjust the indexes of all items after this one
        for (const item of items) {
          if (item.index >= index && item.changeType !== 'removed') {
            item.index = item.index + 1;
          }
        }

        items.splice(index, 0, {
          implicitChangeType,
          changeType: 'added',
          index,
          // NOTE: no leftValue or leftPath
          right: {
            path: [...(right ?? left).path, index],
            value: change[0],
          },
          delta: null,
        });
      }
    }
  }

  for (const item of items) {
    const value =
      item.changeType === 'added' ? item.right.value : item.left.value;
    const shape = getValueShape(value);
    if (shape === 'array') {
      (item as ArrayItemBranch).items = itemsWithChanges({
        left: item.left ?? undefined,
        right: item.right ?? undefined,
        delta: item.delta,
        implicitChangeType: getImplicitChangeType(item),
      } as BranchesWithChanges);
    } else if (shape === 'object') {
      (item as ObjectItemBranch).properties = propertiesWithChanges({
        left: item.left ?? undefined,
        right: item.right ?? undefined,
        delta: item.delta,
        implicitChangeType: getImplicitChangeType(item),
      } as BranchesWithChanges);
    }
  }

  return items;
}

export function getImplicitChangeType(obj: UnifiedBranch) {
  if (['added', 'removed'].includes(obj.implicitChangeType)) {
    // these are "sticky" as we descend
    return obj.implicitChangeType;
  }

  return obj.changeType;
}

export function unifyDocuments(
  before: Document,
  after: Document
): ObjectBranch {
  // The idea here is to format BSON leaf values as text (shell syntax) so that
  // jsondiffpatch can easily diff them. Because we calculate the left and right
  // path for every value we can easily look up the BSON leaf value again and
  // use that when displaying if we choose to.
  const left = unBSON(before);
  const right = unBSON(after);

  const delta = differ.diff(left, right) ?? null;

  // Use the un-bsoned left&right vs before&after so that we're consistent while
  // building the result. Otherwise some parts come from the "un-bsoned" delta
  // and some parts from before&after which still contains bson. As a nice
  // side-effect it also means that the result is easily json serializable which
  // is handy for tests.
  const obj: UnifiedBranch = {
    left: {
      path: [],
      value: left,
    },
    right: {
      path: [],
      value: right,
    },
    delta,
    implicitChangeType: 'unchanged',
    changeType: 'unchanged',
  };

  const doc = {
    ...obj,
    properties: propertiesWithChanges({
      left: obj.left ?? undefined,
      right: obj.right ?? undefined,
      delta: obj.delta,
      implicitChangeType: 'unchanged',
    }),
  };

  return doc;
}
