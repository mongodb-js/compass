import { expect } from 'chai';
import {
  createSearchStageMetadata,
  injectSearchScoreMetadata,
} from './search-score-injection';

describe('injectSearchScoreMetadata', function () {
  it('returns pipeline unchanged when no $search stage is present', function () {
    const pipeline = [{ $match: { name: 'test' } }, { $limit: 10 }];
    expect(injectSearchScoreMetadata(pipeline, 10)).to.deep.equal(pipeline);
  });

  it('injects scoreDetails: true into the $search stage', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline, 10);

    expect(result[0]).to.deep.equal({
      $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
    });
  });

  it('appends $limit/$replaceRoot/$group stages at the end to collect searchScoreDetails', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline, 10);

    expect(result).to.have.lengthOf(4);
    expect(result[1]).to.deep.equal({ $limit: 10 });
    expect(result[2]).to.deep.equal({
      $replaceRoot: {
        newRoot: { $meta: 'searchScoreDetails' },
      },
    });
    expect(result[3]).to.deep.equal({
      $group: {
        _id: 0,
        type: { $first: { $literal: '$search' } },
        scores: { $push: '$$ROOT' },
      },
    });
  });

  it('caps the score count at previewSize, matching the real preview limit', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const result = injectSearchScoreMetadata(pipeline, 25);

    expect(result[1]).to.deep.equal({ $limit: 25 });
  });

  it('preserves stages after $search when injecting metadata', function () {
    const pipeline = [
      { $search: { text: { query: 'foo', path: 'title' } } },
      { $limit: 5 },
    ];
    const result = injectSearchScoreMetadata(pipeline, 10);

    expect(result).to.deep.equal([
      {
        $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
      },
      { $limit: 5 },
      { $limit: 10 },
      {
        $replaceRoot: {
          newRoot: { $meta: 'searchScoreDetails' },
        },
      },
      {
        $group: {
          _id: 0,
          type: { $first: { $literal: '$search' } },
          scores: { $push: '$$ROOT' },
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
    const result = injectSearchScoreMetadata(pipeline, 10);

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
    const result = injectSearchScoreMetadata(pipeline, 10);

    expect(result[0]).to.deep.equal({
      $search: { text: { query: 'foo', path: 'title' }, scoreDetails: true },
    });
  });

  it('does not mutate the original pipeline', function () {
    const pipeline = [{ $search: { text: { query: 'foo', path: 'title' } } }];
    const original = JSON.parse(JSON.stringify(pipeline));
    injectSearchScoreMetadata(pipeline, 10);
    expect(pipeline).to.deep.equal(original);
  });

  it('returns pipeline unchanged for non-search pipelines', function () {
    const pipeline = [
      { $match: { status: 'active' } },
      { $sort: { score: -1 } },
    ];
    expect(injectSearchScoreMetadata(pipeline, 10)).to.deep.equal(pipeline);
  });
});

describe('createSearchStageMetadata', function () {
  const scoreDetails = {
    value: 1,
    description: 'test',
    details: [],
  };

  it('returns null when metadata docs are null', function () {
    expect(createSearchStageMetadata(null, 1)).to.be.null;
  });

  it('returns null when there are no metadata documents', function () {
    expect(createSearchStageMetadata([], 0)).to.be.null;
  });

  it('returns null when the metadata document has no scores', function () {
    expect(createSearchStageMetadata([{ type: '$search', scores: [] }], 0)).to
      .be.null;
  });

  it('returns null when the metadata document has no scores field', function () {
    expect(createSearchStageMetadata([{ _id: 0 }], 1)).to.be.null;
  });

  it('returns the metadata document produced by the server', function () {
    expect(
      createSearchStageMetadata(
        [{ type: '$search', scores: [scoreDetails] }],
        1
      )
    ).to.deep.equal({
      type: '$search',
      scores: [scoreDetails],
    });
  });

  it('returns null when the scores count does not match the document count', function () {
    expect(
      createSearchStageMetadata(
        [{ type: '$search', scores: [scoreDetails] }],
        2
      )
    ).to.be.null;
  });
});
