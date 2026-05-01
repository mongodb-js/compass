import { expect } from 'chai';
import type { SearchIndex } from 'mongodb-data-service';

import { isAutoEmbedIndex } from './is-auto-embed-index';

function indexWithDefinition(
  latestDefinition: SearchIndex['latestDefinition']
): Pick<SearchIndex, 'latestDefinition'> {
  return { latestDefinition };
}

describe('isAutoEmbedIndex', function () {
  it('returns false when fields is missing', function () {
    expect(isAutoEmbedIndex(indexWithDefinition({}))).to.be.false;
    expect(
      isAutoEmbedIndex(
        indexWithDefinition({
          mappings: { dynamic: true },
        })
      )
    ).to.be.false;
  });

  it('returns false when fields is not an array', function () {
    expect(isAutoEmbedIndex(indexWithDefinition({ fields: {} }))).to.be.false;
  });

  it('returns false when fields is empty', function () {
    expect(isAutoEmbedIndex(indexWithDefinition({ fields: [] }))).to.be.false;
  });

  it('returns false when no field has type autoEmbed', function () {
    expect(
      isAutoEmbedIndex(
        indexWithDefinition({
          fields: [
            {
              type: 'vector',
              path: 'plot_embedding',
              numDimensions: 1536,
              similarity: 'euclidean',
            },
            { type: 'filter', path: 'genres' },
          ],
        })
      )
    ).to.be.false;
  });

  it('returns true when any field has type autoEmbed', function () {
    expect(
      isAutoEmbedIndex(
        indexWithDefinition({
          fields: [
            {
              type: 'autoEmbed',
              path: 'content',
            },
          ],
        })
      )
    ).to.be.true;
  });

  it('returns true when autoEmbed is among other field types', function () {
    expect(
      isAutoEmbedIndex(
        indexWithDefinition({
          fields: [
            { type: 'filter', path: 'genre' },
            { type: 'autoEmbed', path: 'body' },
          ],
        })
      )
    ).to.be.true;
  });
});
