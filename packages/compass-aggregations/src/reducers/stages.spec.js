import stages from 'reducers/stages';
import { stageChanged } from 'action-creators';

describe('stages reducer', () => {
  describe('#stages', () => {
    context('when the action is not stage changed', () => {
      it('returns the default state', () => {
        expect(stages(undefined, { type: 'test' })).to.deep.equal([
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
        expect(stages(undefined, stageChanged('{}', 0))).to.deep.equal([
          {
            stage: '{}',
            isValid: true,
            isEnabled: true
          }
        ]);
      });
    });
  });
});
