import { expect } from 'chai';
import { goToCandidate } from './go-to-candidate-fixture';
import { rankGoToResults } from './go-to-search';

const inventory = [
  goToCandidate({
    id: 'connection:c1',
    kind: 'connection',
    primary: 'Production',
  }),
  goToCandidate({
    id: 'database:c1:users',
    kind: 'database',
    primary: 'users',
    namespace: 'users',
  }),
  goToCandidate({
    id: 'collection:c1:users.user_profiles',
    kind: 'collection',
    primary: 'user_profiles',
    namespace: 'users.user_profiles',
  }),
  goToCandidate({
    id: 'collection:c1:users.accounts',
    kind: 'collection',
    primary: 'accounts',
    namespace: 'users.accounts',
  }),
  goToCandidate({
    id: 'connection:c2',
    kind: 'connection',
    primary: 'Staging',
    connectionId: 'c2',
    connected: false,
  }),
];

describe('rankGoToResults', function () {
  it('returns no results when the query is empty', function () {
    expect(rankGoToResults(inventory, '')).to.deep.equal([]);
    expect(rankGoToResults(inventory, '   ')).to.deep.equal([]);
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
