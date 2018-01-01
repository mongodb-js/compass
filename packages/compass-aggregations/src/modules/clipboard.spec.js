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
        stages: [{
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
        stages: [{
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
        stages: [{
          isEnabled: true,
          stageOperator: null,
          stage: '{ name: "testing" }'
        }]
      };

      it('returns an empty string', () => {
        expect(generateClipboardText(state)).to.equal('');
      });
    });
  });
});
