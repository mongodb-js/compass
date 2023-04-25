import { expect } from 'chai';
import { Double, Int32, Long, Timestamp } from 'bson';

import { createGroup } from './groups';
import { createCondition } from './conditions';
import {
  mapCondition,
  mapGroups,
  mapMatchFormStateToMatchStage,
} from './match';
import type {
  MatchConditionGroups,
  MatchCondition,
  MappedGroups,
  MappedCondition,
} from './match';

describe.only('match', function () {
  describe.only('helper functions', function () {
    describe('#mapCondition', function () {
      it('should return a correctly mapped condition', function () {
        const examples = new Map<MatchCondition, MappedCondition>();
        examples.set(
          createCondition({
            operator: '$eq',
            field: 'a1',
            value: 'a1',
            bsonType: 'String',
          }),
          { a1: 'a1' }
        );
        examples.set(
          createCondition({
            operator: '$eq',
            field: 'a1',
            value: 'true',
            bsonType: 'Boolean',
          }),
          { a1: true }
        );
        examples.set(
          createCondition({
            operator: '$eq',
            field: 'a1',
            value: 'false',
            bsonType: 'Boolean',
          }),
          { a1: false }
        );
        examples.set(
          createCondition({
            operator: '$eq',
            field: 'a1',
            value: '',
            bsonType: 'Null',
          }),
          { a1: null }
        );
        examples.set(
          createCondition({
            operator: '$eq',
            field: 'a1',
            value: '',
            bsonType: 'Undefined',
          }),
          { a1: undefined }
        );
        examples.set(
          createCondition({
            operator: '$gt',
            field: 'a1',
            value: '1',
            bsonType: 'Double',
          }),
          { a1: { $gt: new Double(1) } }
        );
        examples.set(
          createCondition({
            operator: '$gte',
            field: 'a1',
            value: '1',
            bsonType: 'Int32',
          }),
          { a1: { $gte: new Int32(1) } }
        );
        examples.set(
          createCondition({
            operator: '$lt',
            field: 'a1',
            value: '1',
            bsonType: 'Int64',
          }),
          { a1: { $lt: Long.fromString('1') } }
        );
        examples.set(
          createCondition({
            operator: '$lte',
            field: 'a1',
            value: '01.28.1994',
            bsonType: 'Date',
          }),
          { a1: { $lte: new Date('01.28.1994') } }
        );
        examples.set(
          createCondition({
            operator: '$ne',
            field: 'a1',
            value: '1',
            bsonType: 'Timestamp',
          }),
          { a1: { $ne: new Timestamp(Long.fromNumber(1)) } }
        );

        for (const [condition, mappedCondition] of examples) {
          expect(mapCondition(condition)).to.deep.equal(mappedCondition);
        }
      });
    });

    // This covers only the expectation of behaviour of function
    // when passed a different value for allowConciseSyntax
    // Other expectations are covered by #mapMatchFormStateToMatchStage
    describe('#mapGroup', function () {
      it('should return conditions with verbose syntax when instructed not to use concise syntax', function () {
        const groups: MatchConditionGroups = [
          createGroup({
            logicalOperator: '$and',
            conditions: [
              createCondition({
                field: 'name1',
                value: 'name1',
                bsonType: 'String',
              }),
              createCondition({
                field: 'name2',
                value: 'name2',
                bsonType: 'String',
              }),
            ],
            groups: [
              createGroup({
                logicalOperator: '$and',
                conditions: [
                  createCondition({
                    field: 'name3',
                    value: 'name3',
                    bsonType: 'String',
                  }),
                  createCondition({
                    field: 'name4',
                    value: 'name4',
                    bsonType: 'String',
                  }),
                ],
              }),
            ],
          }),
        ];

        expect(mapGroups(groups, false)).to.deep.equal({
          $and: [
            { name1: 'name1' },
            { name2: 'name2' },
            {
              $and: [{ name3: 'name3' }, { name4: 'name4' }],
            },
          ],
        });
      });

      it('should return a concise syntax when instructed to', function () {
        const groups: MatchConditionGroups = [
          createGroup({
            logicalOperator: '$and',
            conditions: [
              createCondition({
                field: 'name1',
                value: 'name1',
                bsonType: 'String',
              }),
              createCondition({
                field: 'name2',
                value: 'name2',
                bsonType: 'String',
              }),
            ],
            groups: [
              createGroup({
                logicalOperator: '$and',
                conditions: [
                  createCondition({
                    field: 'name3',
                    value: 'name3',
                    bsonType: 'String',
                  }),
                  createCondition({
                    field: 'name4',
                    value: 'name4',
                    bsonType: 'String',
                  }),
                ],
              }),
            ],
          }),
        ];

        expect(mapGroups(groups, true)).to.deep.equal({
          name1: 'name1',
          name2: 'name2',
          name3: 'name3',
          name4: 'name4',
        });
      });
    });

    describe('#mapMatchFormStateToMatchStage', function () {
      it('should return an empty stage when provided state is empty', function () {
        expect(mapMatchFormStateToMatchStage([])).to.deep.equal({});
      });

      it('should return an empty stage when provided state has empty conditions', function () {
        // See: isNotEmptyCondition function in match.tsx
        const emptyConditionExamples: MatchConditionGroups[] = [
          [createGroup({ logicalOperator: '$and', conditions: [] })],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [createCondition()],
            }),
          ],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
            }),
          ],
          [
            createGroup({ logicalOperator: '$and', conditions: [] }),
            createGroup({ logicalOperator: '$or', conditions: [] }),
          ],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [createCondition()],
            }),
            createGroup({
              logicalOperator: '$or',
              conditions: [createCondition()],
            }),
          ],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
            }),
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
            }),
          ],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [],
                }),
              ],
            }),
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [],
                }),
              ],
            }),
          ],
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [createCondition()],
                }),
              ],
            }),
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({ field: 'Name' }),
                createCondition({ bsonType: 'String' }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [createCondition()],
                }),
              ],
            }),
          ],
        ];

        emptyConditionExamples.forEach((example) => {
          expect(mapMatchFormStateToMatchStage(example)).to.deep.equal({});
        });
      });

      it('should return a stage using the concise syntax for $and whenever possible', function () {
        // See: mapGroups function is match.tsx
        const examples = new Map<MatchConditionGroups, MappedGroups>();
        // Simple conditions
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
            }),
          ],
          { name1: 'name1', name2: 'name2' }
        );

        // Nested but the nesting is with $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                }),
              ],
            }),
          ],
          { name1: 'name1', name2: 'name2', name3: 'name3', name4: 'name4' }
        );

        // Deeply nested but all with $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                  groups: [
                    createGroup({
                      logicalOperator: '$and',
                      conditions: [
                        createCondition({
                          field: 'name5',
                          value: 'name5',
                          bsonType: 'String',
                        }),
                        createCondition({
                          field: 'name6',
                          value: 'name6',
                          bsonType: 'String',
                        }),
                      ],
                      groups: [
                        createGroup({
                          logicalOperator: '$and',
                          conditions: [
                            createCondition({
                              field: 'name7',
                              value: 'name7',
                              bsonType: 'String',
                            }),
                            createCondition({
                              field: 'name8',
                              value: 'name8',
                              bsonType: 'String',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            name1: 'name1',
            name2: 'name2',
            name3: 'name3',
            name4: 'name4',
            name5: 'name5',
            name6: 'name6',
            name7: 'name7',
            name8: 'name8',
          }
        );

        // $and at top level hence concise syntax only at top level
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            name1: 'name1',
            name2: 'name2',
            $or: [{ name3: 'name3' }, { name4: 'name4' }],
          }
        );

        // $and at top level hence concise syntax only at top level
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                }),
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            name1: 'name1',
            name2: 'name2',
            $or: [{ name3: 'name3' }, { name4: 'name4' }],
            $and: [{ name3: 'name3' }, { name4: 'name4' }],
          }
        );

        // $and at top level hence concise syntax at top level
        // another $and nested inside $or hence no concise syntax for that
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'name1',
                  value: 'name1',
                  bsonType: 'String',
                }),
                createCondition({
                  field: 'name2',
                  value: 'name2',
                  bsonType: 'String',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'name3',
                      value: 'name3',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name4',
                      value: 'name4',
                      bsonType: 'String',
                    }),
                  ],
                  groups: [
                    createGroup({
                      logicalOperator: '$and',
                      conditions: [
                        createCondition({
                          field: 'name5',
                          value: 'name5',
                          bsonType: 'String',
                        }),
                        createCondition({
                          field: 'name6',
                          value: 'name6',
                          bsonType: 'String',
                        }),
                      ],
                    }),
                  ],
                }),
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'name7',
                      value: 'name7',
                      bsonType: 'String',
                    }),
                    createCondition({
                      field: 'name8',
                      value: 'name8',
                      bsonType: 'String',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            name1: 'name1',
            name2: 'name2',
            $or: [
              { name3: 'name3' },
              { name4: 'name4' },
              { $and: [{ name5: 'name5' }, { name6: 'name6' }] },
            ],
            $and: [{ name7: 'name7' }, { name8: 'name8' }],
          }
        );

        for (const [group, expectedStage] of examples) {
          expect(mapMatchFormStateToMatchStage(group)).to.deep.equal(
            expectedStage
          );
        }
      });

      it('should return a valid stage for provided form state', function () {
        const examples = new Map<MatchConditionGroups, MappedGroups>();
        // Simple $or
        examples.set(
          [
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
          ],
          { $or: [{ a1: 'a1' }, { a2: 'a2' }] }
        );

        // Simple $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
          ],
          { a1: 'a1', a2: 'a2' }
        );

        // Simple $or and $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
          ],
          {
            $or: [{ a1: 'a1' }, { a2: 'a2' }],
            $and: [{ a1: 'a1' }, { a2: 'a2' }],
          }
        );

        // $and inside $or
        examples.set(
          [
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a1',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a2',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            $or: [
              { a1: 'a1' },
              { a2: 'a2' },
              { $and: [{ a1: 'a1' }, { a2: 'a2' }] },
            ],
          }
        );

        // $or inside $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a1',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a2',
                    }),
                  ],
                }),
              ],
            }),
          ],
          { a1: 'a1', a2: 'a2', $or: [{ a1: 'a1' }, { a2: 'a2' }] }
        );

        // $or inside $or
        examples.set(
          [
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a1',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a2',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            $or: [
              { a1: 'a1' },
              { a2: 'a2' },
              { $or: [{ a1: 'a1' }, { a2: 'a2' }] },
            ],
          }
        );

        // $and inside $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a3',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a4',
                    }),
                  ],
                }),
              ],
            }),
            // Notice that since we use the concise syntax for the nested $ands
            // the last condition with the same field name will have its value
            // in the result set.
          ],
          { a1: 'a3', a2: 'a4' }
        );

        // $and inside $or alongside another $and
        examples.set(
          [
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$and',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a1',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a2',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            $and: [{ a1: 'a1' }, { a2: 'a2' }],
            $or: [
              { a1: 'a1' },
              { a2: 'a2' },
              { $and: [{ a1: 'a1' }, { a2: 'a2' }] },
            ],
          }
        );

        // $or inside $and alongside another $or
        examples.set(
          [
            createGroup({
              logicalOperator: '$or',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
            }),
            createGroup({
              logicalOperator: '$and',
              conditions: [
                createCondition({
                  field: 'a1',
                  bsonType: 'String',
                  value: 'a1',
                }),
                createCondition({
                  field: 'a2',
                  bsonType: 'String',
                  value: 'a2',
                }),
              ],
              groups: [
                createGroup({
                  logicalOperator: '$or',
                  conditions: [
                    createCondition({
                      field: 'a1',
                      bsonType: 'String',
                      value: 'a1',
                    }),
                    createCondition({
                      field: 'a2',
                      bsonType: 'String',
                      value: 'a2',
                    }),
                  ],
                }),
              ],
            }),
          ],
          {
            $or: [{ a1: 'a1' }, { a2: 'a2' }],
            $and: [
              { a1: 'a1' },
              { a2: 'a2' },
              { $or: [{ a1: 'a1' }, { a2: 'a2' }] },
            ],
          }
        );
        for (const [group, expectedStage] of examples) {
          expect(mapMatchFormStateToMatchStage(group)).to.deep.equal(
            expectedStage
          );
        }
      });
    });
  });
});
