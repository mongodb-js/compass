import { expect } from 'chai';
import { BSON } from 'bson';
import type { BuilderState, ConditionRow } from './builder-query';
import {
  EMPTY_BUILDER_STATE,
  compileBuilderState,
  compiledQueryToAppliedQuery,
  parseValueText,
  valueToText,
} from './builder-query';

function condition(row: Partial<ConditionRow>): ConditionRow {
  return {
    id: 'c1',
    field: 'status',
    operator: 'eq',
    valueText: "'shipped'",
    enabled: true,
    ...row,
  };
}

function state(overrides: Partial<BuilderState> = {}): BuilderState {
  return { ...EMPTY_BUILDER_STATE, ...overrides };
}

describe('builder-query', function () {
  describe('valueToText', function () {
    it('renders a string the way the query bar does', function () {
      expect(valueToText('London')).to.equal("'London'");
    });

    it('renders BSON types in shell syntax', function () {
      expect(
        valueToText(new BSON.ObjectId('6a709bfd0ce4efdf334e9979'))
      ).to.equal("ObjectId('6a709bfd0ce4efdf334e9979')");
    });

    it('renders an empty string for a missing value', function () {
      expect(valueToText(undefined)).to.equal('');
    });
  });

  describe('parseValueText', function () {
    it('reads a value back out of shell syntax', function () {
      expect(parseValueText("'London'")).to.deep.equal({
        ok: true,
        value: 'London',
      });
    });

    it('round trips a value rendered by valueToText', function () {
      const objectId = new BSON.ObjectId('6a709bfd0ce4efdf334e9979');
      const parsed = parseValueText(valueToText(objectId));
      expect(parsed.ok).to.equal(true);
      expect(String((parsed as { value: unknown }).value)).to.equal(
        String(objectId)
      );
    });

    it('reports empty input rather than guessing', function () {
      expect(parseValueText('   ')).to.deep.equal({
        ok: false,
        error: 'Value is empty',
      });
    });

    it('reports a parse failure instead of throwing', function () {
      const parsed = parseValueText('{ this is not valid');
      expect(parsed.ok).to.equal(false);
    });
  });

  describe('compileBuilderState', function () {
    it('compiles an empty builder to an empty filter', function () {
      const compiled = compileBuilderState(state());
      expect(compiled).to.deep.include({
        filter: {},
        project: null,
        sort: null,
        skip: null,
        limit: null,
      });
      expect(compiled.errors).to.be.empty;
    });

    it('folds conditions matching all into one document', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({ id: 'c1' }),
            condition({
              id: 'c2',
              field: 'total',
              operator: 'gt',
              valueText: '100',
            }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({
        status: 'shipped',
        total: { $gt: 100 },
      });
    });

    it('uses $and when the same field is used twice', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({
              id: 'c1',
              field: 'total',
              operator: 'gt',
              valueText: '10',
            }),
            condition({
              id: 'c2',
              field: 'total',
              operator: 'lt',
              valueText: '90',
            }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({
        $and: [{ total: { $gt: 10 } }, { total: { $lt: 90 } }],
      });
    });

    it('compiles $or when matching any', function () {
      const compiled = compileBuilderState(
        state({
          match: 'or',
          conditions: [
            condition({ id: 'c1' }),
            condition({ id: 'c2', field: 'status', valueText: "'pending'" }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({
        $or: [{ status: 'shipped' }, { status: 'pending' }],
      });
    });

    it('wraps a single value for the in operator', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [condition({ operator: 'in', valueText: "'shipped'" })],
        })
      );
      expect(compiled.filter).to.deep.equal({
        status: { $in: ['shipped'] },
      });
    });

    it('keeps a list as it is for the in operator', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({ operator: 'in', valueText: "['shipped', 'pending']" }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({
        status: { $in: ['shipped', 'pending'] },
      });
    });

    it('compiles the exists operators without reading a value', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({ id: 'c1', operator: 'exists', valueText: '' }),
            condition({
              id: 'c2',
              field: 'cancelledAt',
              operator: 'notExists',
              valueText: '',
            }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({
        status: { $exists: true },
        cancelledAt: { $exists: false },
      });
      expect(compiled.errors).to.be.empty;
    });

    it('skips disabled rows', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({ id: 'c1' }),
            condition({
              id: 'c2',
              field: 'total',
              valueText: '5',
              enabled: false,
            }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({ status: 'shipped' });
    });

    it('reports a bad value and leaves the rest of the query usable', function () {
      const compiled = compileBuilderState(
        state({
          conditions: [
            condition({ id: 'c1' }),
            condition({ id: 'c2', field: 'total', valueText: '{ oops' }),
          ],
        })
      );
      expect(compiled.filter).to.deep.equal({ status: 'shipped' });
      expect(compiled.errors).to.have.lengthOf(1);
      expect(compiled.errors[0]).to.contain('total');
    });

    it('compiles projection and sort rows', function () {
      const compiled = compileBuilderState(
        state({
          projections: [
            {
              id: 'p1',
              field: 'conversationid',
              mode: 'include',
              enabled: true,
            },
            { id: 'p2', field: 'secret', mode: 'exclude', enabled: true },
          ],
          sorts: [
            { id: 's1', field: 'timestamp', direction: 'asc', enabled: true },
            { id: 's2', field: 'total', direction: 'desc', enabled: true },
          ],
        })
      );
      expect(compiled.project).to.deep.equal({ conversationid: 1, secret: 0 });
      expect(compiled.sort).to.deep.equal({ timestamp: 1, total: -1 });
    });

    it('honours the section toggles', function () {
      const full = state({
        conditions: [condition({})],
        projections: [
          { id: 'p1', field: 'timestamp', mode: 'include', enabled: true },
        ],
        sorts: [
          { id: 's1', field: 'timestamp', direction: 'asc', enabled: true },
        ],
        queryEnabled: false,
        projectionEnabled: false,
        sortEnabled: false,
      });
      const compiled = compileBuilderState(full);
      expect(compiled.filter).to.deep.equal({});
      expect(compiled.project).to.equal(null);
      expect(compiled.sort).to.equal(null);
    });

    it('reads skip and limit', function () {
      const compiled = compileBuilderState(state({ skip: '10', limit: '50' }));
      expect(compiled.skip).to.equal(10);
      expect(compiled.limit).to.equal(50);
    });

    it('reports a non numeric limit', function () {
      const compiled = compileBuilderState(state({ limit: 'lots' }));
      expect(compiled.limit).to.equal(null);
      expect(compiled.errors).to.deep.equal(['Limit must be a whole number']);
    });
  });

  describe('compiledQueryToAppliedQuery', function () {
    it('always includes every property, so removed rows are cleared', function () {
      // A property missing from the applied query keeps its previous value,
      // which is what made a removed projection stay in effect.
      const query = compiledQueryToAppliedQuery(compileBuilderState(state()));
      expect(Object.keys(query).sort()).to.deep.equal([
        'filter',
        'limit',
        'project',
        'skip',
        'sort',
      ]);
      expect(query.project).to.equal(undefined);
      expect(query.sort).to.equal(undefined);
      expect(query.skip).to.equal(undefined);
      expect(query.limit).to.equal(undefined);
    });

    it('clears the projection once its last row is removed', function () {
      const withProjection = state({
        projections: [
          { id: 'p1', field: 'firstName', mode: 'include', enabled: true },
        ],
      });
      expect(
        compiledQueryToAppliedQuery(compileBuilderState(withProjection)).project
      ).to.deep.equal({ firstName: 1 });

      const removed = state({ projections: [] });
      const query = compiledQueryToAppliedQuery(compileBuilderState(removed));
      expect(query).to.have.property('project');
      expect(query.project).to.equal(undefined);
    });

    it('clears the projection when the section is switched off', function () {
      const query = compiledQueryToAppliedQuery(
        compileBuilderState(
          state({
            projections: [
              { id: 'p1', field: 'firstName', mode: 'include', enabled: true },
            ],
            projectionEnabled: false,
          })
        )
      );
      expect(query).to.have.property('project');
      expect(query.project).to.equal(undefined);
    });

    it('passes through the values that are set', function () {
      const query = compiledQueryToAppliedQuery(
        compileBuilderState(
          state({
            conditions: [condition({})],
            sorts: [
              {
                id: 's1',
                field: 'timestamp',
                direction: 'desc',
                enabled: true,
              },
            ],
            skip: '5',
            limit: '20',
          })
        )
      );
      expect(query.filter).to.deep.equal({ status: 'shipped' });
      expect(query.sort).to.deep.equal({ timestamp: -1 });
      expect(query.skip).to.equal(5);
      expect(query.limit).to.equal(20);
    });
  });
});
