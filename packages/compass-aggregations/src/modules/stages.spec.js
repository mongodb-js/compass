import reducer, {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stageToggled,
  STAGE_ADDED,
  STAGE_CHANGED,
  STAGE_COLLAPSE_TOGGLED,
  STAGE_DELETED,
  STAGE_MOVED,
  STAGE_OPERATOR_SELECTED,
  STAGE_TOGGLED } from 'modules/stages';

describe('stages module', () => {
  describe('#reducer', () => {
    context('when the action is undefined', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: true,
            stageOperator: null,
            isExpanded: true
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
            isEnabled: true,
            stageOperator: null,
            isExpanded: true
          }
        ]);
      });
    });

    context('when the action is stage collapse toggled', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageCollapseToggled(0))).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: true,
            stageOperator: null,
            isExpanded: false
          }
        ]);
      });
    });

    context('when the action is stage toggled', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageToggled(0))).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: false,
            stageOperator: null,
            isExpanded: true
          }
        ]);
      });
    });

    context('when the action is stage operator selected', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageOperatorSelected(0, '$collStats'))).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: true,
            stageOperator: '$collStats',
            isExpanded: true
          }
        ]);
      });
    });

    context('when the action is stage added', () => {
      it('returns the new state with an additional stage', () => {
        expect(reducer(undefined, stageAdded())).to.deep.equal([
          {
            stage: '',
            isValid: true,
            isEnabled: true,
            stageOperator: null,
            isExpanded: true
          },
          {
            stage: '',
            isValid: true,
            isEnabled: true,
            stageOperator: null,
            isExpanded: true
          }
        ]);
      });
    });

    context('when the action is stage deleted', () => {
      it('returns the new state with the deleted stage', () => {
        expect(reducer(undefined, stageDeleted(0))).to.deep.equal([]);
      });
    });
  });

  describe('#stageAdded', () => {
    it('returns the STAGE_ADDED action', () => {
      expect(stageAdded()).to.deep.equal({
        type: STAGE_ADDED
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

  describe('#stageCollapseToggled', () => {
    it('returns the STAGE_COLLAPSE_TOGGLED action', () => {
      expect(stageCollapseToggled(0)).to.deep.equal({
        type: STAGE_COLLAPSE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageDeleted', () => {
    it('returns the STAGE_DELETED action', () => {
      expect(stageDeleted(0)).to.deep.equal({
        type: STAGE_DELETED,
        index: 0
      });
    });
  });

  describe('#stageOperatorSelected', () => {
    it('returns the STAGE_OPERATOR_SELECTED action', () => {
      expect(stageOperatorSelected(0, '$collStats')).to.deep.equal({
        type: STAGE_OPERATOR_SELECTED,
        index: 0,
        stageOperator: '$collStats'
      });
    });
  });

  describe('#stageToggled', () => {
    it('returns the STAGE_TOGGLED action', () => {
      expect(stageToggled(0)).to.deep.equal({
        type: STAGE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageMoved', () => {
    it('returns the STAGE_MOVED action', () => {
      expect(stageMoved(0, 5)).to.deep.equal({
        type: STAGE_MOVED,
        fromIndex: 0,
        toIndex: 5
      });
    });
  });
});
