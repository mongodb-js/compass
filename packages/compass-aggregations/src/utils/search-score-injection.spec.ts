import { expect } from 'chai';
import {
  injectSearchScoreMetadata,
  SEARCH_SCORE_DETAILS_FIELD,
} from './search-score-injection';

describe('injectSearchScoreMetadata', function () {
  it('returns pipeline unchanged when no $search stage is present', function () {
    const pipeline = [{ $match: { name: 'test' } }, { $limit: 10 }];
    expect(injectSearchScoreMetadata(pipeline)).to.deep.equal(pipeline);
  });

  it('injects scoreDetails: true into the $search stage', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result[0]).to.deep.equal({
      $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
    });
  });

  it('appends _searchAIFeaturesScoreDetails $addFields stage at the end', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result).to.have.lengthOf(2);
    expect(result[1]).to.deep.equal({
      $addFields: {
        [SEARCH_SCORE_DETAILS_FIELD]: { $meta: 'searchScoreDetails' },
      },
    });
  });

  it('preserves existing $search stage options when injecting scoreDetails', function () {
    const pipeline = [
      {
        $search: {
          index: 'my-index',
          text: { query: 'foo', path: 'title' },
          count: { type: 'total' },
        },
      },
    ];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result[0]).to.deep.equal({
      $search: {
        index: 'my-index',
        text: { query: 'foo', path: 'title' },
        count: { type: 'total' },
        scoreDetails: true,
      },
    });
  });

  it('overrides scoreDetails: false if already set on $search stage', function () {
    const pipeline = [
      {
        $search: { text: { query: 'foo', path: 'title' }, scoreDetails: false },
      },
    ];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result[0]).to.deep.equal({
      $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
    });
  });

  it('does not mutate the original pipeline', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const original = JSON.parse(JSON.stringify(pipeline));
    injectSearchScoreMetadata(pipeline);
    expect(pipeline).to.deep.equal(original);
  });

  it('returns pipeline unchanged for non-search pipelines', function () {
    const pipeline = [
      { $match: { status: 'active' } },
      { $sort: { score: -1 } },
    ];
    expect(injectSearchScoreMetadata(pipeline)).to.deep.equal(pipeline);
  });
});
