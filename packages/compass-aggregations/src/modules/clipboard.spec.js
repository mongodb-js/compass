import { copyToClipboard, generateClipboardText } from 'modules/clipboard';

describe('clipboard module', () => {
  describe('#copyToClipboard', () => {
    it('returns the copy to clipboard thunk', () => {
      expect(copyToClipboard()).to.be.a('function');
    });
  });

  describe('#generateClipboardText', () => {
    context('when the stages are enabled', () => {
      const state = {
        pipeline: [{
          isEnabled: true,
          stageOperator: '$match',
          stage: '{ name: "testing" }'
        }]
      };

      it('returns the generated text', () => {
        expect(generateClipboardText(state)).to.equal('{ $match: { name: "testing" } }');
      });
    });

    context('when a stage is not enabled', () => {
      const state = {
        pipeline: [{
          isEnabled: false,
          stageOperator: '$match',
          stage: '{ name: "testing" }'
        }]
      };

      it('returns an empty string', () => {
        expect(generateClipboardText(state)).to.equal('');
      });
    });

    context('when a stage has no stage operator', () => {
      const state = {
        pipeline: [{
          isEnabled: true,
          stageOperator: null,
          stage: '{ name: "testing" }'
        }]
      };

      it('returns an empty string', () => {
        expect(generateClipboardText(state)).to.equal('');
      });
    });

    context('when there are multiple stages', () => {
      const state = {
        pipeline: [
          {
            isEnabled: true,
            stageOperator: '$match',
            stage: '{ name: "testing" }'
          },
          {
            isEnabled: true,
            stageOperator: '$project',
            stage: '{ name: 1 }'
          }
        ]
      };

      it('separates each stage with a comma', () => {
        expect(generateClipboardText(state)).to.equal(
          '{ $match: { name: "testing" } }, { $project: { name: 1 } }'
        );
      });
    });
  });
});
