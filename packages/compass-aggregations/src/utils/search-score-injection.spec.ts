import { expect } from 'chai';
import {
  createSearchStageMetadata,
  injectSearchScoreMetadata,
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

  it('appends a $project stage at the end to surface searchScoreDetails', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result).to.have.lengthOf(2);
    expect(result[1]).to.deep.equal({
      $project: {
        _id: 0,
        type: { $literal: '$search' },
        scores: { $meta: 'searchScoreDetails' },
      },
    });
  });

  it('preserves stages after $search when injecting metadata', function () {
    const pipeline = [
      { $search: { text: { query: 'foo', path: 'title' } } },
      { $limit: 5 },
    ];
    const result = injectSearchScoreMetadata(pipeline);

    expect(result).to.deep.equal([
      {
        $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
      },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          type: { $literal: '$search' },
          scores: { $meta: 'searchScoreDetails' },
        },
      },
    ]);
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

describe('createSearchStageMetadata', function () {
  const scoreDetails = {
    value: 1,
    description: 'test',
    details: [],
  };

  it('returns null when metadata docs are null', function () {
    expect(createSearchStageMetadata(null)).to.be.null;
  });

  it('returns null when no metadata documents contain scores', function () {
    expect(createSearchStageMetadata([{}, { type: '$search' }])).to.be.null;
  });

  it('builds stage metadata from metadata document scores', function () {
    expect(
      createSearchStageMetadata([
        { type: '$search', scores: scoreDetails },
        { type: '$search' },
      ])
    ).to.deep.equal({
      type: '$search',
      scores: [scoreDetails, null],
    });
  });
});
