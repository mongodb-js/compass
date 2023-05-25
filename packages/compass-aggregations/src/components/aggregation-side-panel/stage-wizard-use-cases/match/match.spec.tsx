import React from 'react';
import { expect } from 'chai';
import { render, cleanup } from '@testing-library/react';
import Sinon from 'sinon';
import { Double } from 'bson';
import type { TypeCastTypes } from 'hadron-type-checker';

import { makeCreateCondition } from './match-condition-form';
import MatchForm, {
  areUniqueExpressions,
  getNestingDepth,
  isNotEmptyCondition,
  isNotEmptyGroup,
  makeCompactGroupExpression,
  toMatchConditionExpression,
  toMatchGroupExpression,
} from './match';
import { setComboboxValue } from '../../../../../test/form-helper';
import { SINGLE_SELECT_LABEL } from '../field-combobox';
import { makeCreateGroup } from './match-group-form';
import { SAMPLE_FIELDS } from './helper';

import type { MatchCondition } from './match';
import type { CreateConditionFn } from './match-condition-form';
import type { CreateGroupFn } from './match-group-form';

describe('match', function () {
  let createCondition: CreateConditionFn;
  let createGroup: CreateGroupFn;
  beforeEach(function () {
    createCondition = makeCreateCondition();
    createGroup = makeCreateGroup(createCondition);
  });

  describe('#helpers - getNestingDepth', function () {
    it('should return 0 when there are no nested groups', function () {
      expect(getNestingDepth(createGroup())).to.equal(0);
    });

    it('should return the correct max nesting depth as per the number of groups deeply nested', function () {
      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [createGroup()],
          })
        )
      ).to.equal(1);

      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [
              createGroup({
                nestedGroups: [createGroup()],
              }),
            ],
          })
        )
      ).to.equal(2);

      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [
              createGroup(),
              createGroup({
                nestedGroups: [
                  createGroup({
                    nestedGroups: [createGroup()],
                  }),
                ],
              }),
            ],
          })
        )
      ).to.equal(3);
    });
  });

  describe('#helpers - isNotEmptyCondition', function () {
    it('should return true when a condition have both field and bsonType', function () {
      expect(
        isNotEmptyCondition(
          createCondition({
            field: 'name',
            bsonType: 'String',
          })
        )
      ).to.be.true;
    });

    it('should return false when condition does not have any of bsonType or field', function () {
      expect(isNotEmptyCondition(createCondition())).to.be.false;
      expect(
        isNotEmptyCondition(
          createCondition({
            field: 'name',
            bsonType: '' as TypeCastTypes,
          })
        )
      ).to.be.false;
      expect(
        isNotEmptyCondition(
          createCondition({
            bsonType: 'String',
          })
        )
      ).to.be.false;
    });
  });

  describe('#helpers - isNotEmptyGroup', function () {
    it('should return false when a group has empty conditions and empty nested groups', function () {
      // Empty conditions - by default has empty condition
      expect(isNotEmptyGroup(createGroup())).to.be.false;

      // Empty conditions - three condition but all are empty
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(),
              createCondition({ field: 'something', bsonType: '' as any }),
              createCondition({ field: '', bsonType: 'String' }),
            ],
          })
        )
      ).to.be.false;

      // Empty groups - has empty condition and empty nested group (because empty condition)
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [createCondition()],
            nestedGroups: [createGroup()],
          })
        )
      ).to.be.false;

      // Empty groups - has empty condition and empty nested group (because empty condition and empty nested-nested group)
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [createCondition()],
            nestedGroups: [
              createGroup({
                nestedGroups: [createGroup()],
              }),
            ],
          })
        )
      ).to.be.false;
    });

    it('should return true when a group has at-least one non-empty condition or nested group', function () {
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(), // Empty condition
              createCondition({ field: 'name', bsonType: 'String' }), // Non-empty condition
            ],
          })
        )
      ).to.be.true;

      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(), // Empty condition
            ],
            nestedGroups: [
              createGroup(), // Empty nested group
              createGroup({
                conditions: [
                  createCondition({ field: 'name', bsonType: 'String' }), // Non-empty condition in nested group
                ],
              }),
            ],
          })
        )
      ).to.be.true;
    });
  });

  describe('#helpers - areUniqueExpressions', function () {
    it('should return true if keys of all the expressions in the provided list are unique otherwise false', function () {
      expect(
        areUniqueExpressions([{ name: 'Compass' }, { version: 'Standalone' }])
      ).to.be.true;

      expect(
        areUniqueExpressions([
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: 'Something-else' },
        ])
      ).to.be.false;

      expect(
        areUniqueExpressions([
          { name: 'Compass' },
          { version: 'Standalone' },
          { wick: 'Something-else', name: 'Impossible' },
        ])
      ).to.be.false;
    });
  });

  describe('#helpers - toMatchConditionExpression', function () {
    it('should return a compact expression when operator is $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$eq',
        bsonType: 'String',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: 'Compass',
      });
    });

    it('should return a verbose expression when operator anything but $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$ne',
        bsonType: 'String',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: { $ne: 'Compass' },
      });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$gt' })
      ).to.deep.equal({ name: { $gt: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$gte' })
      ).to.deep.equal({ name: { $gte: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$lt' })
      ).to.deep.equal({ name: { $lt: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$lte' })
      ).to.deep.equal({ name: { $lte: 'Compass' } });
    });

    // Note: The purpose of this test is to ensure that we are doing type
    // casting of the values, wether it is correct or not is the responsibility
    // of hadron-type-checker and is tested there
    it('should cast the value to provided bsonType', function () {
      const condition = createCondition({
        field: 'name',
        value: '12',
        operator: '$ne',
        bsonType: 'Double',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: { $ne: new Double(12) },
      });
    });
  });

  describe('#helpers - toMatchGroupExpression', function () {
    let conditionA: MatchCondition;
    let conditionB: MatchCondition;
    let conditionC: MatchCondition;
    let conditionD: MatchCondition;
    beforeEach(function () {
      conditionA = createCondition({
        field: 'name',
        value: 'Compass',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionB = createCondition({
        field: 'version',
        value: '1.37',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionC = createCondition({
        field: 'mode',
        value: 'Standalone',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionD = createCondition({
        field: 'ga',
        value: 'true',
        bsonType: 'Boolean',
        operator: '$eq',
      });
    });
    const rootGroupOperators = ['$and', '$or'] as const;
    rootGroupOperators.forEach(function (operator) {
      context(`when root group is ${operator} group`, function () {
        context('and there are only conditions in the group', function () {
          it(`should produce a verbose ${operator} expression`, function () {
            expect(
              toMatchGroupExpression(
                createGroup({
                  logicalOperator: operator,
                  conditions: [conditionA, conditionB],
                })
              )
            ).to.deep.equal({
              [operator]: [{ name: 'Compass' }, { version: '1.37' }],
            });
          });
        });
        context('and there are only nested groups in the group', function () {
          it(`should produce a verbose ${operator} expression`, function () {
            const nestedGroupA = createGroup({
              conditions: [conditionA, conditionB],
            });
            const nestedGroupB = createGroup({
              logicalOperator: '$or',
              conditions: [conditionC, conditionD],
            });
            const group = createGroup({
              logicalOperator: operator,
              nestedGroups: [nestedGroupA, nestedGroupB],
            });
            expect(toMatchGroupExpression(group)).to.deep.equal({
              [operator]: [
                {
                  $and: [{ name: 'Compass' }, { version: '1.37' }],
                },
                {
                  $or: [{ mode: 'Standalone' }, { ga: true }],
                },
              ],
            });
          });
        });
        context(
          'and there are mix of conditions and nested group in the group',
          function () {
            it(`should produce a verbose ${operator} expression`, function () {
              const nestedGroup = createGroup({
                conditions: [conditionA, conditionB],
              });
              const group = createGroup({
                logicalOperator: operator,
                conditions: [conditionC, conditionD],
                nestedGroups: [nestedGroup],
              });

              expect(toMatchGroupExpression(group)).to.deep.equal({
                [operator]: [
                  { mode: 'Standalone' },
                  { ga: true },
                  {
                    $and: [{ name: 'Compass' }, { version: '1.37' }],
                  },
                ],
              });
            });
          }
        );
      });
    });
  });

  describe('#helpers - makeCompactGroupExpression', function () {
    let conditionA: MatchCondition;
    let conditionB: MatchCondition;
    let conditionC: MatchCondition;
    let conditionD: MatchCondition;
    beforeEach(function () {
      conditionA = createCondition({
        field: 'name',
        value: 'Compass',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionB = createCondition({
        field: 'version',
        value: '1.37',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionC = createCondition({
        field: 'mode',
        value: 'Standalone',
        bsonType: 'String',
        operator: '$eq',
      });
      conditionD = createCondition({
        field: 'ga',
        value: 'true',
        bsonType: 'Boolean',
        operator: '$eq',
      });
    });

    context('when root group is a $and group', function () {
      context('and there are only unique conditions in the group', function () {
        it('should always produce an implicit $and syntax', function () {
          const rootGroup = createGroup({
            conditions: [conditionA, conditionB, conditionC, conditionD],
          });
          expect(
            makeCompactGroupExpression(toMatchGroupExpression(rootGroup))
          ).to.deep.equal({
            name: 'Compass',
            version: '1.37',
            mode: 'Standalone',
            ga: true,
          });
        });
      });

      context(
        'and there are only unique conditions and nested group in the group',
        function () {
          it('should always produce an implicit $and syntax', function () {
            const nestedGroupA = createGroup({
              logicalOperator: '$or',
              conditions: [conditionC, conditionD],
            });

            const rootGroup = createGroup({
              logicalOperator: '$and',
              conditions: [conditionA, conditionB],
              nestedGroups: [nestedGroupA],
            });

            expect(
              makeCompactGroupExpression(toMatchGroupExpression(rootGroup))
            ).to.deep.equal({
              name: 'Compass',
              version: '1.37',
              $or: [
                {
                  mode: 'Standalone',
                },
                {
                  ga: true,
                },
              ],
            });
          });
        }
      );

      context('and there is a duplicate condition in the group', function () {
        it('should produce the verbose syntax', function () {
          const rootGroup = createGroup({
            conditions: [
              conditionA,
              conditionB,
              { ...conditionA, operator: '$ne' },
            ],
          });
          expect(
            makeCompactGroupExpression(toMatchGroupExpression(rootGroup))
          ).to.deep.equal({
            $and: [
              {
                name: 'Compass',
              },
              {
                version: '1.37',
              },
              {
                name: { $ne: 'Compass' },
              },
            ],
          });
        });
      });

      context(
        'and there is a duplicate nested group in the group',
        function () {
          it('should produce the verbose syntax', function () {
            const rootGroup = createGroup({
              nestedGroups: [
                createGroup({ conditions: [conditionA, conditionB] }),
                createGroup({ conditions: [conditionC, conditionD] }),
              ],
            });

            expect(
              makeCompactGroupExpression(toMatchGroupExpression(rootGroup))
            ).to.deep.equal({
              $and: [
                {
                  $and: [
                    {
                      name: 'Compass',
                    },
                    {
                      version: '1.37',
                    },
                  ],
                },
                {
                  $and: [
                    {
                      mode: 'Standalone',
                    },
                    {
                      ga: true,
                    },
                  ],
                },
              ],
            });
          });
        }
      );
    });

    context('when root group is a $or group', function () {
      it('should always produce a verbose syntax regardless of what is in the group', function () {
        const fixtures = [
          {
            rootGroup: createGroup({
              logicalOperator: '$or',
              conditions: [conditionA, conditionB],
            }),
            syntax: {
              $or: [
                {
                  name: 'Compass',
                },
                {
                  version: '1.37',
                },
              ],
            },
          },
          {
            rootGroup: createGroup({
              logicalOperator: '$or',
              nestedGroups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [conditionA, conditionB],
                }),
                createGroup({
                  logicalOperator: '$or',
                  conditions: [conditionA, conditionB],
                }),
              ],
            }),
            syntax: {
              $or: [
                {
                  $and: [
                    {
                      name: 'Compass',
                    },
                    {
                      version: '1.37',
                    },
                  ],
                },
                {
                  $or: [
                    {
                      name: 'Compass',
                    },
                    {
                      version: '1.37',
                    },
                  ],
                },
              ],
            },
          },
        ];

        fixtures.forEach(function ({ rootGroup, syntax }) {
          expect(
            makeCompactGroupExpression(toMatchGroupExpression(rootGroup))
          ).to.deep.equal(syntax);
        });
      });
    });
  });

  describe('#component', function () {
    afterEach(cleanup);

    it('should call onChange with converted stage value', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'name');
      expect(onChangeSpy.lastCall.args).deep.equal(["{\n name: ''\n}", null]);
    });

    it('should call onChange with an error if there was an error during the conversion to stage', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      // Setting the field to age will set the type to Double and without a
      // correct value the conversion will fail which is why we will get an
      // error
      setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'age');
      const [jsString, error] = onChangeSpy.lastCall.args;
      expect(jsString).to.equal('{}');
      expect(error.message).to.equal("Value '' is not a valid Double value");
    });
  });
});
