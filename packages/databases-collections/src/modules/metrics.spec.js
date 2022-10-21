import { expect } from 'chai';
import { prepareMetrics } from './metrics';

describe('metrics module', function() {
  describe('#prepareMetrics', function() {
    it('returns default metrics', async function() {
      const metrics = await prepareMetrics({});

      expect(metrics).to.be.deep.equal({});
    });

    it('returns metrics with capped property', async function() {
      const options = () => Promise.resolve({ capped: true });
      const metrics = await prepareMetrics({ options });

      expect(metrics).to.be.deep.equal({
        isCapped: true,
        hasCustomCollation: false,
        collectionType: 'collection'
      });
    });

    it('returns metrics with hasCustomCollation property', async function() {
      const options = () => Promise.resolve({ collation: {} });
      const metrics = await prepareMetrics({ options });

      expect(metrics).to.be.deep.equal({
        isCapped: false,
        hasCustomCollation: true,
        collectionType: 'collection'
      });
    });

    it('returns metrics with time-series collectionType property', async function() {
      const options = () => Promise.resolve({ timeseries: {} });
      const metrics = await prepareMetrics({ options });

      expect(metrics).to.be.deep.equal({
        isCapped: false,
        hasCustomCollation: false,
        collectionType: 'time-series'
      });
    });
  });
});
