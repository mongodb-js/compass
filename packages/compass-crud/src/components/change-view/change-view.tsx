import React, { useState, useContext, createContext, useMemo } from 'react';
import { type Document } from 'bson';
import TypeChecker from 'hadron-type-checker';

import {
  BSONValue,
  Icon,
  css,
  cx,
  palette,
  spacing,
  fontFamilies,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { getImplicitChangeType, unifyDocuments } from './unified-document';
import type {
  ObjectPath,
  UnifiedBranch,
  ObjectBranch,
  ArrayBranch,
  PropertyBranch,
  ObjectPropertyBranch,
  ArrayPropertyBranch,
  ItemBranch,
  ObjectItemBranch,
  ArrayItemBranch,
  Branch,
} from './unified-document';
import { getValueShape } from './shape-utils';

type LeftRightContextType = {
  left: Document;
  right: Document;
};

const expandButtonStyles = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  '&:hover': {
    cursor: 'pointer',
  },
  display: 'flex',
  alignSelf: 'center',
  color: 'inherit',
  paddingRight: spacing[100],
});

const addedStylesDark = css({
  backgroundColor: palette.green.dark2,
});

const addedStylesLight = css({
  backgroundColor: palette.green.light1,
});

const removedStylesDark = css({
  backgroundColor: palette.red.dark3,
});

const removedStylesLight = css({
  backgroundColor: palette.red.light2,
});

function getObjectKey(obj: UnifiedBranch) {
  const path = (obj.right ?? obj.left).path;

  const parts: string[] = [];
  for (const part of path) {
    if (typeof part === 'string') {
      // not actually sure about escaping here. only really matters if we ever
      // want to parse this again which is unlikely
      parts.push(`["${part.replace(/"/g, '\\')}"]`);
    } else {
      parts.push(`[${part}]`);
    }
  }
  return parts.join('') + '_' + obj.changeType;
}

const changeArrayItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginTop: '1px', // make sure adjacent red/green blocks don't touch
});

const changeKeyIndexStyles = css({
  fontWeight: 'bold',
  alignSelf: 'flex-start',
  paddingRight: spacing[100],
});

const changeSummaryStyles = css({
  display: 'inline-flex',
  alignItems: 'flex-start',

  // Not sure if it is better with/without this. There's very little horizontal
  // space so even ellipsized strings tend to cause wrapping without this, but
  // then with it the wrapping ends up being a bit aggressive.
  //flexWrap: 'wrap',
  //rowGap: '1px',
});

function getChangeSummaryClass(obj: UnifiedBranch, darkMode?: boolean) {
  const changeType = getChangeType(obj);
  if (changeType === 'unchanged' || changeType === 'changed') {
    return undefined;
  }

  if (changeType === 'added') {
    return darkMode ? addedStylesDark : addedStylesLight;
  } else {
    return darkMode ? removedStylesDark : removedStylesLight;
  }
}

function ExpandButton({
  isOpen,
  toggleIsOpen,
}: {
  isOpen: boolean;
  toggleIsOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isOpen}
      aria-label={isOpen ? 'Collapse field items' : 'Expand field items'}
      className={expandButtonStyles}
      onClick={toggleIsOpen}
    >
      <Icon size="xsmall" glyph={isOpen ? 'CaretDown' : 'CaretRight'}></Icon>
    </button>
  );
}

function ChangeArrayItemArray({ item }: { item: ItemBranch }) {
  const [isOpen, setIsOpen] = useState(
    !!item.delta || item.changeType !== 'unchanged'
  );

  const toggleIsOpen = function () {
    setIsOpen(!isOpen);
  };

  const text = 'Array';

  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(item, darkMode);

  return (
    <div className={changeArrayItemStyles}>
      <div className={changeSummaryStyles}>
        <ExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {item.index}:
        </div>
        <div className={summaryClass}>{text}</div>
      </div>
      <ChangeArray obj={item as ArrayItemBranch} isOpen={isOpen} />
    </div>
  );
}

function ChangeArrayItemObject({ item }: { item: ObjectItemBranch }) {
  const [isOpen, setIsOpen] = useState(
    !!item.delta || item.changeType !== 'unchanged'
  );

  const toggleIsOpen = function () {
    setIsOpen(!isOpen);
  };

  const text = 'Object';

  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(item, darkMode);

  return (
    <div className={changeArrayItemStyles}>
      <div className={changeSummaryStyles}>
        <ExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {item.index}:
        </div>
        <div className={summaryClass}>{text}</div>
      </div>
      <ChangeObject obj={item} isOpen={isOpen} />
    </div>
  );
}

const changeLeafStyles = css({
  paddingLeft: spacing[400],
});

function ChangeArrayItemLeaf({ item }: { item: ItemBranch }) {
  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(item, darkMode);

  return (
    <div className={cx(changeArrayItemStyles, changeLeafStyles)}>
      <div className={changeSummaryStyles}>
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {item.index}:
        </div>
        <div className={summaryClass}>
          <ChangeLeaf obj={item} />
        </div>
      </div>
    </div>
  );
}

function ChangeArrayItem({ item }: { item: ItemBranch }) {
  const value =
    item.changeType === 'added' ? item.right.value : item.left.value;
  const shape = getValueShape(value);
  if (shape === 'array') {
    // array summary followed by array items if expanded
    return <ChangeArrayItemArray item={item as ArrayItemBranch} />;
  } else if (shape === 'object') {
    // object summary followed by object properties if expanded
    return <ChangeArrayItemObject item={item as ObjectItemBranch} />;
  }

  // simple/bson value only
  return <ChangeArrayItemLeaf item={item} />;
}

const sepStyles = css({
  marginRight: spacing[100],
});

function Sep() {
  return <span className={sepStyles}>, </span>;
}

const changeArrayStyles = css({
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: spacing[400],
});

const changeArrayInlineWrapStyles = css({
  marginTop: '1px', // don't touch the previous item
});

const changeArrayInlineStyles = css({
  marginLeft: spacing[600] + spacing[100],
  display: 'inline-flex', // so the green/red background colour doesn't stretch all the way to the end
  flexWrap: 'wrap',
});

function ChangeArray({ obj, isOpen }: { obj: ArrayBranch; isOpen: boolean }) {
  if (isOpen) {
    const implicitChangeType = getImplicitChangeType(obj);

    if (
      obj.items.every((item) => {
        const value =
          item.changeType === 'added' ? item.right.value : item.left.value;
        return (
          getValueShape(value) === 'leaf' && value?._bsontype === undefined
        );
      })
    ) {
      // if it is an array containing just simple (ie. not bson) leaf values
      // then we can special-case it and output it all on one line
      const classes = [changeArrayInlineStyles];

      if (implicitChangeType === 'added') {
        classes.push('change-array-inline-added');
      }

      if (implicitChangeType === 'removed') {
        classes.push('change-array-inline-removed');
      }

      return (
        <div className={changeArrayInlineWrapStyles}>
          <div className={cx(...classes)}>
            [
            {obj.items.map((item, index) => {
              const key = getObjectKey(item);
              return (
                <div className="change-array-inline-element" key={key}>
                  <ChangeLeaf obj={item} />
                  {index !== obj.items.length - 1 && <Sep />}
                </div>
              );
            })}
            ]
          </div>
        </div>
      );
    }

    return (
      <div className={changeArrayStyles}>
        {obj.items.map((item) => {
          const key = getObjectKey(item);
          return <ChangeArrayItem key={key} item={item} />;
        })}
      </div>
    );
  }

  return null;
}

function ChangeObjectPropertyObject({
  property,
}: {
  property: ObjectPropertyBranch;
}) {
  const [isOpen, setIsOpen] = useState(
    !!property.delta || property.changeType !== 'unchanged'
  );

  const toggleIsOpen = function () {
    setIsOpen(!isOpen);
  };

  const text = 'Object';

  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(property, darkMode);

  return (
    <div className={changeObjectPropertyStyles}>
      <div className={changeSummaryStyles}>
        <ExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {property.objectKey}:
        </div>
        <div className={summaryClass}>{text}</div>
      </div>
      <ChangeObject obj={property} isOpen={isOpen} />
    </div>
  );
}

const changeObjectPropertyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginTop: '1px', // stop the red/green blocks touching
});

function ChangeObjectPropertyArray({ property }: { property: PropertyBranch }) {
  const [isOpen, setIsOpen] = useState(
    !!property.delta || property.changeType !== 'unchanged'
  );

  const toggleIsOpen = function () {
    setIsOpen(!isOpen);
  };

  const text = 'Array';

  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(property, darkMode);

  return (
    <div className={changeObjectPropertyStyles}>
      <div className={changeSummaryStyles}>
        <ExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {property.objectKey}:
        </div>
        <div className={summaryClass}>{text}</div>
      </div>
      <ChangeArray obj={property as ArrayPropertyBranch} isOpen={isOpen} />
    </div>
  );
}

function ChangeObjectPropertyLeaf({ property }: { property: PropertyBranch }) {
  const darkMode = useDarkMode();
  const summaryClass = getChangeSummaryClass(property, darkMode);

  return (
    <div className={cx(changeObjectPropertyStyles, changeLeafStyles)}>
      <div className={changeSummaryStyles}>
        <div className={cx(changeKeyIndexStyles, summaryClass)}>
          {property.objectKey}:
        </div>
        <div className={summaryClass}>
          <ChangeLeaf obj={property} />
        </div>
      </div>
    </div>
  );
}

function ChangeObjectProperty({ property }: { property: PropertyBranch }) {
  const value =
    property.changeType === 'added'
      ? property.right.value
      : property.left.value;
  const shape = getValueShape(value);
  if (shape === 'array') {
    // array summary followed by array items if expanded
    return (
      <ChangeObjectPropertyArray property={property as ArrayPropertyBranch} />
    );
  } else if (shape === 'object') {
    // object summary followed by object properties if expanded
    return (
      <ChangeObjectPropertyObject property={property as ObjectPropertyBranch} />
    );
  }

  // simple/bson value only
  return <ChangeObjectPropertyLeaf property={property} />;
}

const changeObjectStyles = css({
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: spacing[400] /* indent all nested properties*/,
});

const rootChangeObjectStyles = css({
  // don't indent the top-level object
  paddingLeft: 0,
});

function ChangeObject({
  obj,
  isOpen,
  isRoot,
}: {
  obj: ObjectBranch;
  isOpen: boolean;
  isRoot?: boolean;
}) {
  // A sample object / sub-document. ie. not an array and not a leaf.
  if (isOpen) {
    return (
      <div className={cx(changeObjectStyles, isRoot && rootChangeObjectStyles)}>
        {obj.properties.map((property) => {
          const key = getObjectKey(property);
          return <ChangeObjectProperty key={key} property={property} />;
        })}
      </div>
    );
  }

  return null;
}

function getLeftClassName(obj: UnifiedBranch, darkMode?: boolean) {
  const addedClass = darkMode ? addedStylesDark : addedStylesLight;
  const removedClass = darkMode ? removedStylesDark : removedStylesLight;

  if (obj.implicitChangeType === 'removed') {
    return removedClass;
  }

  if (obj.implicitChangeType === 'added') {
    return addedClass;
  }

  if (obj.changeType === 'unchanged') {
    return undefined;
  }

  if (obj.changeType === 'removed') {
    return removedClass;
  }

  return obj.changeType === 'changed' ? removedClass : addedClass;
}

function getRightClassName(obj: UnifiedBranch, darkMode?: boolean) {
  return darkMode ? addedStylesDark : addedStylesLight;
}

function getChangeType(obj: UnifiedBranch) {
  if (['added', 'removed'].includes(obj.implicitChangeType)) {
    // these are "sticky" as we descend
    return obj.implicitChangeType;
  }

  return obj.changeType;
}

function lookupValue(path: ObjectPath, value: any): any {
  const [head, ...rest] = path;
  if (rest.length) {
    return lookupValue(rest, value[head]);
  }
  return value[head];
}

const changeValueStyles = css({
  display: 'inline-flex',
  flexWrap: 'wrap',
  columnGap: spacing[100], // when removed and added are next to each other
  rowGap: '1px', // when removed & added wrapped
});

function ChangeLeaf({ obj }: { obj: UnifiedBranch }) {
  // Anything that is not an object or array. This includes simple javascript
  // values like strings, numbers, booleans and undefineds, but also dates or
  // bson values.
  const { left, right } = useContext(LeftRightContext) as LeftRightContextType;

  const changeType = getChangeType(obj);
  // We could be showing the left value (unchanged, removed), right value
  // (added) or both (changed). Furthermore the left one could have no colour or
  // it could be red and the right one is always green.
  const includeLeft = ['unchanged', 'changed', 'removed'].includes(changeType);
  const includeRight = ['changed', 'added'].includes(changeType);

  const darkMode = useDarkMode();

  const leftValue = includeLeft
    ? lookupValue((obj.left as Branch).path, left)
    : undefined;
  const rightValue = includeRight
    ? lookupValue((obj.right as Branch).path, right)
    : undefined;

  return (
    <div className={changeValueStyles}>
      {includeLeft && (
        <div className={getLeftClassName(obj, darkMode)}>
          {<BSONValue type={TypeChecker.type(leftValue)} value={leftValue} />}
        </div>
      )}
      {includeRight && (
        <div className={getRightClassName(obj, darkMode)}>
          {<BSONValue type={TypeChecker.type(rightValue)} value={rightValue} />}
        </div>
      )}
    </div>
  );
}

const LeftRightContext = createContext<LeftRightContextType | null>(null);

const changeViewStyles = css({
  overflow: 'auto',
  fontFamily: fontFamilies.code,

  // match our Document component
  fontSize: '12px',
  lineHeight: '16px',
});

const changeViewStylesDark = css({
  color: palette.gray.light2,
});

const changeViewStylesLight = css({
  color: palette.gray.dark2,
});

export function ChangeView({
  name,
  before,
  after,
}: {
  name: string;
  before: Document;
  after: Document;
}) {
  const obj = useMemo(() => unifyDocuments(before, after), [before, after]);

  const darkMode = useDarkMode();

  // Keep the left and right values in context so that the ChangeLeaf component
  // can easily find them again to lookup the original BSON values. Otherwise
  // we'd have to pass references down through every component.
  return (
    <LeftRightContext.Provider value={{ left: before, right: after }}>
      <div
        className={cx(
          changeViewStyles,
          darkMode ? changeViewStylesDark : changeViewStylesLight
        )}
        data-testid={`change-view-${name}`}
      >
        <ChangeObject obj={obj} isOpen={true} isRoot={true} />
      </div>
    </LeftRightContext.Provider>
  );
}
