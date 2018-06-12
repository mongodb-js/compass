import { exportToLanguage, generatePipeline } from 'modules/export-to-language';

describe('export-to-language module', () => {
  describe('#exportToLanguage', () => {
    it('returns the export to language thunk', () => {
      expect(exportToLanguage()).to.be.a('function');
    });
  });

  describe('#generatePipeline', () => {
    context('when the stages are enabled', () => {
      const state = {
        pipeline: [{
          isEnabled: true,
          stageOperator: '$match',
          executor: { '$match': { name: 'testing' }}
        }]
      };

      it('returns the generated text', () => {
        expect(generatePipeline(state)).to.deep.equal([{ $match: { name: 'testing' } }]);
      });
    });

    context('when a stage is not enabled', () => {
      context('when there is only a single stage', () => {
        const state = {
          pipeline: [{
            isEnabled: false,
            stageOperator: '$match',
            executor: { $match: { name: 'testing' }}
          }]
        };

        it('returns an empty array string', () => {
          expect(generatePipeline(state)).to.deep.equal([]);
        });
      });

      context('when there are multiple stages', () => {
        const state = {
          pipeline: [
            {
              isEnabled: false,
              stageOperator: '$match',
              executor: { $match: { name: 'testing' }}
            },
            {
              isEnabled: false,
              stageOperator: '$match',
              executor: { $match: { name: 'testing' }}
            },
            {
              isEnabled: true,
              stageOperator: '$match',
              executor: { $match: { name: 'testing' }}
            }
          ]
        };

        it('does not include commas for disabled stages', () => {
          expect(generatePipeline(state)).to.deep.equal([{ $match: { name: 'testing' } }]);
        });
      });
    });

    context('when a stage has no stage operator', () => {
      const state = {
        pipeline: [{
          isEnabled: true,
          stageOperator: null,
          executor: { $match: { name: 'testing' }}
        }]
      };

      it('returns an empty array string', () => {
        expect(generatePipeline(state)).to.deep.equal([]);
      });
    });

    context('when there are multiple stages', () => {
      const state = {
        pipeline: [
          {
            isEnabled: true,
            stageOperator: '$match',
            executor: { $match: { name: 'testing' }}
          },
          {
            isEnabled: true,
            stageOperator: '$project',
            executor: { $project: { name: 1 }}
          }
        ]
      };

      it('separates each stage with a comma', () => {
        expect(generatePipeline(state)).to.deep.equal([
          { $match: { name: 'testing' }},
          { $project: { name: 1 }}
        ]);
      });
    });
  });
});
