import { stageChanged, STAGE_CHANGED } from 'action-creators';

describe('#stageChanged', () => {
  it('returns the STAGE_CHANGED action', () => {
    expect(stageChanged('{}', 0)).to.deep.equal({
      type: STAGE_CHANGED,
      index: 0,
      stage: '{}'
    });
  });
});
