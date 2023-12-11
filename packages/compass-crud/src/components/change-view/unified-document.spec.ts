/* eslint-disable no-console */
import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import type { Document } from 'bson';
import { ObjectId } from 'bson';

import type {
  ObjectPath,
  ObjectBranch,
  ArrayBranch,
  Branch,
  UnifiedBranch,
} from './unified-document';
import { unifyDocuments } from './unified-document';
import { unBSON } from './bson-utils';
import { fixtureGroups } from '../../../test/before-after-fixtures';

function lookupValue(path: ObjectPath, value: any): any {
  const [head, ...rest] = path;
  if (rest.length) {
    return lookupValue(rest, value[head]);
  }
  return value[head];
}

function formatPath(path: ObjectPath) {
  const bits = path.map((part) =>
    typeof part === 'string' ? `["${part}"]` : `[${part}]`
  );
  return bits.join('');
}

function checkValue(branch: Branch, data: Document, side: string) {
  const value = lookupValue(branch.path, data);

  // Because we ran unBSON() on the data before diffing, we have to unBSON the
  // value we find again to check that it matches, otherwise we check the bson
  // value we found when looking it up against that value stringified.
  const valueToCheck = unBSON(value);

  expect(valueToCheck, `${formatPath(branch.path)} (${side})`).to.deep.equal(
    branch.value
  );
}

function getChangeType(obj: UnifiedBranch) {
  if (['added', 'removed'].includes(obj.implicitChangeType)) {
    // these are "sticky" as we descend
    return obj.implicitChangeType;
  }

  return obj.changeType;
}

function checkAllPaths(obj: UnifiedBranch, before: Document, after: Document) {
  if ('properties' in obj) {
    for (const property of (obj as ObjectBranch).properties) {
      checkAllPaths(property, before, after);
    }
  } else if ('items' in obj) {
    for (const item of (obj as ArrayBranch).items) {
      checkAllPaths(item, before, after);
    }
  } else {
    // It is kinda non-sensical to look up a value on the left if it was added
    // or right if it was removed.
    const changeType = getChangeType(obj);
    const includeLeft = ['unchanged', 'changed', 'removed'].includes(
      changeType
    );
    const includeRight = ['changed', 'added'].includes(changeType);

    if (includeLeft) {
      expect(obj.left).to.exist;
      checkValue(obj.left as Branch, before, 'left');
    } else {
      expect(obj.left, changeType).to.not.exist;
    }

    if (includeRight) {
      expect(obj.right).to.exist;
      checkValue(obj.right as Branch, after, 'right');
    } else if (changeType !== 'unchanged') {
      expect(obj.right, changeType).to.not.exist;
    }
  }
}

describe('unifyDocuments', function () {
  it('merges before and after documents into one structure', function () {
    const before = {
      a: new ObjectId('642d766b7300158b1f22e972'),
      foo: /regex/i,
    };
    const after = {
      b: new ObjectId('642d766c7300158b1f22e975'),
      foo: /regex/i,
    };

    const result = unifyDocuments(before, after);

    // this assertion checks the basic structure of the result
    expect(result).to.deep.equal({
      left: {
        path: [],
        value: {
          a: 'new ObjectId("642d766b7300158b1f22e972")',
          foo: '/regex/i',
        },
      },
      right: {
        path: [],
        value: {
          b: 'new ObjectId("642d766c7300158b1f22e975")',
          foo: '/regex/i',
        },
      },
      delta: {
        a: ['new ObjectId("642d766b7300158b1f22e972")', 0, 0],
        b: ['new ObjectId("642d766c7300158b1f22e975")'],
      },
      implicitChangeType: 'unchanged',
      changeType: 'unchanged',
      properties: [
        {
          implicitChangeType: 'unchanged',
          objectKey: 'a',
          delta: null,
          changeType: 'removed',
          left: {
            path: ['a'],
            value: 'new ObjectId("642d766b7300158b1f22e972")',
          },
        },
        {
          implicitChangeType: 'unchanged',
          objectKey: 'foo',
          delta: null,
          changeType: 'unchanged',
          left: { path: ['foo'], value: '/regex/i' },
          right: { path: ['foo'], value: '/regex/i' },
        },
        {
          implicitChangeType: 'unchanged',
          changeType: 'added',
          objectKey: 'b',
          right: {
            path: ['b'],
            value: 'new ObjectId("642d766c7300158b1f22e975")',
          },
          delta: null,
        },
      ],
    });

    checkAllPaths(result, before, after);
  });

  // These tests are only really useful as regression tests. Any change to the
  // result structure will cause them all to fail and then we'd likely have to
  // replace all the expected results. Assuming it was intended.
  for (const group of fixtureGroups) {
    context(group.name, function () {
      for (const { name, before, after } of group.fixtures) {
        it(name, async function () {
          const result = unifyDocuments(before, after);
          const json = JSON.stringify(result, null, 4);

          const filename = `${group.name} ${name}.json`.replace(/ /g, '_');
          const expectedPath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            'test',
            'fixture-results',
            filename
          );

          let expectedText: string;
          try {
            expectedText = await fs.readFile(expectedPath, 'utf8');
          } catch (err) {
            // NOTE: If this fails it is probably because a new fixture was
            // added. Check that this expected output makes sense and just add
            // the file. Tip: If it fails for everything and that's expected,
            // just remove the result files and temporarily write them from in
            // here.
            console.log(expectedPath);
            console.log(json);
            throw err;
          }

          try {
            expect(json).to.deep.equal(expectedText);
          } catch (err) {
            // NOTE: If this fails it is probably because we changed the
            // structure. Check that the expected result makes sense and just
            // replace the file. Tip: Focusing these tests and using --bail
            // should really help.
            console.log(expectedPath);
            console.log(json);
            throw err;
          }

          checkAllPaths(result, before, after);
        });
      }
    });
  }
});
