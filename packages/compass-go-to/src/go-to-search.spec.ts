import { expect } from 'chai';
import type { GoToCandidate } from './go-to-candidates';
import { rankGoToResults } from './go-to-search';

function candidate(
  partial: Pick<GoToCandidate, 'id' | 'kind' | 'primary'> &
    Partial<GoToCandidate>
): GoToCandidate {
  return {
    connectionId: 'c1',
    secondary: partial.kind === 'connection' ? '' : 'Prod',
    connected: true,
    ...partial,
  };
}

const inventory: GoToCandidate[] = [
  candidate({ id: 'connection:c1', kind: 'connection', primary: 'Production' }),
  candidate({
    id: 'database:c1:users',
    kind: 'database',
    primary: 'users',
    namespace: 'users',
  }),
  candidate({
    id: 'collection:c1:users.user_profiles',
    kind: 'collection',
    primary: 'user_profiles',
    namespace: 'users.user_profiles',
  }),
  candidate({
    id: 'collection:c1:users.accounts',
    kind: 'collection',
    primary: 'accounts',
    namespace: 'users.accounts',
  }),
  candidate({
    id: 'connection:c2',
    kind: 'connection',
    primary: 'Staging',
    connectionId: 'c2',
    connected: false,
  }),
];

describe('rankGoToResults', function () {
  it('returns the first 20 candidates when the query is empty', function () {
    const many = Array.from({ length: 25 }, (_, i) =>
      candidate({
        id: `connection:c${i}`,
        kind: 'connection',
        primary: `Conn ${i}`,
        connectionId: `c${i}`,
      })
    );

    expect(rankGoToResults(many, '').map((c) => c.id)).to.deep.equal(
      many.slice(0, 20).map((c) => c.id)
    );
    expect(rankGoToResults(many, '   ')).to.have.length(20);
  });

  it('ranks exact primary matches ahead of fuzzy matches', function () {
    const ranked = rankGoToResults(inventory, 'users');

    expect(ranked[0]?.id).to.equal('database:c1:users');
  });

  it('ranks prefix matches ahead of weaker fuzzy matches', function () {
    const ranked = rankGoToResults(inventory, 'user_');

    expect(ranked[0]?.id).to.equal('collection:c1:users.user_profiles');
  });

  it('can match nested items by qualified namespace', function () {
    const ranked = rankGoToResults(inventory, 'users.accounts');

    expect(ranked[0]?.id).to.equal('collection:c1:users.accounts');
  });

  it('includes disconnected connection rows that match', function () {
    const ranked = rankGoToResults(inventory, 'Stag');

    expect(ranked.map((c) => c.id)).to.deep.equal(['connection:c2']);
  });
});
