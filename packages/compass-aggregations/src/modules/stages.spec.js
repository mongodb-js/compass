import reducer, { stageChanged, STAGE_CHANGED } from 'modules/stages';

describe('stages module', () => {
  describe('#reducer', () => {
    context('when the action is not stage changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: true
          }
        ]);
      });
    });

    context('when the action is stage changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageChanged('{}', 0))).to.deep.equal([
          {
            stage: '{}',
            isValid: true,
            isEnabled: true
          }
        ]);
      });
    });
  });

  describe('#stageChanged', () => {
    it('returns the STAGE_CHANGED action', () => {
      expect(stageChanged('{}', 0)).to.deep.equal({
        type: STAGE_CHANGED,
        index: 0,
        stage: '{}'
      });
    });
  });
});
