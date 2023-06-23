import * as GuideCueGroups from './guide-cue-groups';
import { GuideCueService, type Cue } from './guide-cue-service';
import { type GuideCueStorage } from './guide-cue-storage';
import { expect } from 'chai';
import {
  DuplicateCueStepError,
  GroupStepsCompleteError,
  InvalidCueStepError,
  UnregisteredGroupError,
} from './guide-cue-exceptions';
import Sinon from 'sinon';

class TestGuideCueStorage implements GuideCueStorage {
  private data: string[] = [];
  private getDataKey(cueId: string, groupId?: string) {
    return `${cueId}-${groupId}`;
  }
  isCueVisited(cueId: string, groupId?: string) {
    return this.data.indexOf(this.getDataKey(cueId, groupId)) !== -1;
  }
  markCueAsVisited(cueId: string, groupId?: string) {
    if (!this.isCueVisited(cueId, groupId)) {
      this.data.push(this.getDataKey(cueId, groupId));
    }
  }
}

const GROUP_STEPS_MAP = new Map();
GROUP_STEPS_MAP.set('group-one', 1);
GROUP_STEPS_MAP.set('group-two', 2);

describe('GuideCueService', function () {
  let guideCueService: GuideCueService;
  let guideCueStorage: GuideCueStorage;

  const sandbox = Sinon.createSandbox();

  beforeEach(function () {
    guideCueStorage = new TestGuideCueStorage();
    guideCueService = new GuideCueService(guideCueStorage);
  });

  before(function () {
    sandbox.replace(GuideCueGroups, 'GROUP_STEPS_MAP', GROUP_STEPS_MAP);
  });

  after(function () {
    sandbox.restore();
  });

  context('when new cue is added', function () {
    it('throws if group is not registered', function () {
      try {
        guideCueService.addCue({
          cueId: '',
          step: 1,
          groupId: 'group-three',
        } as any);
      } catch (e) {
        expect(e).to.be.instanceOf(UnregisteredGroupError);
      }
    });

    it('throws if group steps are complete', function () {
      guideCueService.addCue({
        cueId: 'one',
        step: 1,
        groupId: 'group-two',
      } as any);
      guideCueService.addCue({
        cueId: 'two',
        step: 2,
        groupId: 'group-two',
      } as any);
      try {
        guideCueService.addCue({
          cueId: 'three',
          step: 3,
          groupId: 'group-two',
        } as any);
      } catch (e) {
        expect(e).to.be.instanceOf(GroupStepsCompleteError);
      }
    });

    it('throws if cue step is greater than group steps', function () {
      try {
        guideCueService.addCue({
          cueId: 'two',
          step: 2,
          groupId: 'group-two',
        } as any);
      } catch (e) {
        expect(e).to.be.instanceOf(InvalidCueStepError);
      }
    });

    it('throws if another cue with same step is already registered', function () {
      guideCueService.addCue({
        cueId: 'one',
        step: 1,
        groupId: 'group-two',
      } as any);
      try {
        guideCueService.addCue({
          cueId: 'two',
          step: 1,
          groupId: 'group-two',
        } as any);
      } catch (e) {
        expect(e).to.be.instanceOf(DuplicateCueStepError);
      }
    });

    it('add a new cue to the list when its not visited already', function () {
      const cue = {
        cueId: 'one',
        step: 1,
        groupId: 'group-one',
        isIntersecting: true,
      };
      guideCueService.addCue(cue as any);

      expect((guideCueService as any)._cues).to.deep.equal([
        {
          ...cue,
          isVisited: false,
        },
      ]);
    });

    it('add a new cue to the list when its visited already', function () {
      const cue = {
        cueId: 'one',
        step: 1,
        groupId: 'group-one',
        isIntersecting: true,
      };
      guideCueStorage.markCueAsVisited(cue.cueId, cue.groupId);

      guideCueService.addCue(cue as any);
      expect((guideCueService as any)._cues).to.deep.equal([
        {
          ...cue,
          isVisited: true,
        },
      ]);
    });

    it('fires an event with added cue if there is no active cue', function () {
      const cue = {
        cueId: 'one',
        step: 1,
        groupId: 'group-one',
        isIntersecting: true,
      };
      const dispatchEventSpy = Sinon.spy(guideCueService, 'dispatchEvent');

      guideCueService.addCue(cue as any);

      expect(dispatchEventSpy.calledOnce).to.be.true;

      const event = dispatchEventSpy.firstCall.args[0];

      expect(event.type).to.equal('show-cue');
      expect((event as CustomEvent).detail).to.deep.equal({
        cueId: cue.cueId,
        groupId: cue.groupId,
      });
    });

    it('fires an event with active cue if there is active cue', function () {
      const cue1 = {
        cueId: 'one',
        step: 1,
        groupId: 'group-one',
        isIntersecting: true,
      };
      const cue2 = {
        cueId: 'two-one',
        step: 1,
        groupId: 'group-two',
        isIntersecting: true,
      };
      const cue3 = {
        cueId: 'two-two',
        step: 2,
        groupId: 'group-two',
        isIntersecting: true,
      };

      const spy = Sinon.spy(guideCueService, 'dispatchEvent');

      // Add cue2 first. This group has 2 steps and since this group
      // is incomplete, nothing is fired for it.
      // Add cue1. Its a grouped cue with only one step. And as soon it
      // is added, it fires an event.
      // Add cue3. As its added, we already have an active cue and it
      // also fires an event for same cue (cue1).

      guideCueService.addCue(cue2 as any);
      guideCueService.addCue(cue1 as any);
      guideCueService.addCue(cue3 as any);

      expect(spy.callCount).to.be.equal(2);

      // When adding first cue, it is made active.
      spy.getCalls().forEach(function ({ args: [event] }) {
        expect(event.type).to.equal('show-cue');
        expect((event as CustomEvent).detail).to.deep.equal({
          cueId: cue1.cueId,
          groupId: cue1.groupId,
        });
      });
    });
  });

  context('when cue is removed', function () {
    const cue = {
      cueId: 'one',
      step: 1,
      groupId: 'group-one',
      isIntersecting: true,
    } as unknown as Cue;
    beforeEach(function () {
      guideCueService.addCue(cue);
      expect((guideCueService as any)._cues).to.have.lengthOf(1);
    });

    it('remove cues from the list', function () {
      guideCueService.removeCue(cue.cueId, cue.groupId);
      expect((guideCueService as any)._cues).to.have.lengthOf(0);
    });

    it('when active is removed, it sets _activeCue to null', function () {
      expect((guideCueService as any)._activeCue).to.deep.equal({
        ...cue,
        isVisited: false,
      });
      guideCueService.removeCue(cue.cueId, cue.groupId);
      expect((guideCueService as any)._activeCue).to.be.null;
    });
  });

  context('number of steps in a group', function () {
    it('steps in a group', function () {
      guideCueService.addCue({
        cueId: 'two',
        step: 2,
        groupId: 'group-two',
        isIntersecting: true,
      } as any);
      expect(guideCueService.getCountOfSteps('group-two')).to.equal(1);

      guideCueService.addCue({
        cueId: 'one',
        step: 1,
        groupId: 'group-two',
        isIntersecting: true,
      } as any);
      expect(guideCueService.getCountOfSteps('group-two')).to.equal(2);
    });

    it('steps in a standalone', function () {
      expect(guideCueService.getCountOfSteps()).to.equal(1);
    });
  });

  context('returns next cue', function () {
    it('when all cues are standalone', function () {
      const cues = [
        {
          cueId: 'one',
          step: 1,
          isVisited: false,
          isIntersecting: true,
        },
        {
          cueId: 'two',
          step: 1,
          isVisited: false,
          isIntersecting: true,
        },
      ];
      (guideCueService as any)._cues = cues;

      guideCueService.onNext();
      expect((guideCueService as any)._activeCue).to.deep.equal(cues[0]);

      guideCueService.markCueAsVisited(cues[0].cueId);

      guideCueService.onNext();
      expect((guideCueService as any)._activeCue).to.deep.equal(cues[1]);

      guideCueService.markCueAsVisited(cues[1].cueId);

      guideCueService.onNext();
      expect((guideCueService as any)._activeCue).to.be.null;
    });

    it('when first cue is from group and then standalone cue is added', function () {
      const cues = [
        // cue from a group with 2 steps
        {
          cueId: 'one',
          groupId: 'group-two',
          step: 1,
          isVisited: false,
          isIntersecting: true,
        },
        // standalone cue
        {
          cueId: 'two',
          step: 1,
          isVisited: false,
          isIntersecting: true,
        },
        // cue from a group with 2 steps
        {
          cueId: 'two',
          groupId: 'group-two',
          step: 2,
          isIntersecting: true,
          isVisited: false,
        },
      ] as unknown as Cue[];

      (guideCueService as any)._cues = [cues[0], cues[1]];

      // nothing active yet. set the first possible cue (which is standalone one)
      guideCueService.onNext();
      expect((guideCueService as any)._activeCue).to.deep.equal(cues[1]);

      // mark the cue as visited.
      guideCueService.markCueAsVisited(cues[1].cueId);
      // nothing more to show
      guideCueService.onNext();
      expect((guideCueService as any)._activeCue).to.be.null;

      // add step 2 from the group-two. now the group is
      // complete and it can be shown to the user.
      (guideCueService as any)._cues.push(cues[2]);

      // now group-two
      guideCueService.onNext();
      expect((guideCueService as any)._activeGroupId).to.equal('group-two');
      expect((guideCueService as any)._activeCue).to.deep.equal(cues[0]);

      guideCueService.markCueAsVisited(cues[0].cueId, cues[0].groupId);
      guideCueService.onNext();
      expect((guideCueService as any)._activeGroupId).to.equal('group-two');
      expect((guideCueService as any)._activeCue).to.deep.equal(cues[2]);

      guideCueService.markCueAsVisited(cues[2].cueId, cues[2].groupId);
      // nothing more to show
      guideCueService.onNext();
      expect((guideCueService as any)._activeGroupId).to.be.null;
      expect((guideCueService as any)._activeCue).to.be.null;
    });
  });

  context('marks cue as visited', function () {
    const cue = {
      cueId: 'one',
      step: 1,
      groupId: 'group-one',
      isIntersecting: true,
    } as unknown as Cue;
    let markCueAsVisited: Sinon.SinonSpy;
    beforeEach(function () {
      markCueAsVisited = Sinon.spy(guideCueStorage, 'markCueAsVisited');
      guideCueService.addCue(cue as any);
      guideCueService.markCueAsVisited(cue.cueId, cue.groupId);
    });

    it('updates visited property in a cue', function () {
      expect((guideCueService as any)._cues).to.deep.equal([
        {
          ...cue,
          isVisited: true,
        },
      ]);
    });

    it('calls storage update', function () {
      expect(markCueAsVisited.calledOnce).to.be.true;
      expect(markCueAsVisited.firstCall.args).to.deep.equal([
        cue.cueId,
        cue.groupId,
      ]);
    });

    it('sets active cue to null', function () {
      expect((guideCueService as any)._activeCue).to.be.null;
    });
  });

  context('marks group as visited', function () {
    context('when all the cues of group are added', function () {
      const cue1 = {
        cueId: 'one',
        step: 1,
        groupId: 'group-two',
        isIntersecting: true,
      } as unknown as Cue;
      const cue2 = {
        cueId: 'two',
        step: 2,
        groupId: 'group-two',
        isIntersecting: true,
      };

      let markCueAsVisited: Sinon.SinonSpy;

      beforeEach(function () {
        markCueAsVisited = Sinon.spy(guideCueStorage, 'markCueAsVisited');
        guideCueService.addCue(cue1 as any);
        guideCueService.addCue(cue2 as any);
        guideCueService.markGroupAsVisited(cue1.groupId);
      });

      it('updates isVisited property for all group cues', function () {
        const expected = [cue1, cue2].map((x) => ({ ...x, isVisited: true }));
        expect((guideCueService as any)._cues).to.deep.equal(expected);
      });

      it('calls storage update', function () {
        expect(markCueAsVisited.callCount).to.equal(2);

        expect(markCueAsVisited.firstCall.args).to.deep.equal([
          cue1.cueId,
          cue1.groupId,
        ]);
        expect(markCueAsVisited.secondCall.args).to.deep.equal([
          cue2.cueId,
          cue2.groupId,
        ]);
      });

      it('sets active properties to null', function () {
        expect((guideCueService as any)._activeCue).to.be.null;
        expect((guideCueService as any)._activeGroupId).to.be.null;
      });
    });

    context('when all the cues of group are not added', function () {
      const cue1 = {
        cueId: 'one',
        step: 1,
        groupId: 'group-two',
        isIntersecting: true,
      } as unknown as Cue;

      let markCueAsVisited: Sinon.SinonSpy;

      beforeEach(function () {
        markCueAsVisited = Sinon.spy(guideCueStorage, 'markCueAsVisited');
        guideCueService.addCue(cue1 as any);
        guideCueService.markGroupAsVisited(cue1.groupId);
      });

      it('does not update isVisited property for group cues', function () {
        expect((guideCueService as any)._cues).to.deep.equal([
          {
            ...cue1,
            isVisited: false,
          },
        ]);
      });

      it('does not call storage update', function () {
        expect(markCueAsVisited.callCount).to.equal(0);
      });
    });
  });

  context('marks all reigstered cues as visited', function () {
    const cue1 = {
      cueId: 'one',
      step: 1,
      groupId: 'group-two',
      isIntersecting: true,
    };
    const cue2 = {
      cueId: 'two',
      step: 2,
      groupId: 'group-two',
      isIntersecting: true,
    };
    const cue3 = {
      cueId: 'one',
      step: 1,
      groupId: 'group-one',
      isIntersecting: true,
    };

    let markCueAsVisited: Sinon.SinonSpy;

    beforeEach(function () {
      markCueAsVisited = Sinon.spy(guideCueStorage, 'markCueAsVisited');
      guideCueService.addCue(cue1 as any);
      guideCueService.addCue(cue2 as any);
      guideCueService.addCue(cue3 as any);
      guideCueService.markAllCuesAsVisited();
    });

    it('updates isVisited property for all group cues', function () {
      const expected = [cue1, cue2, cue3].map((x) => ({
        ...x,
        isVisited: true,
      }));
      expect((guideCueService as any)._cues).to.deep.equal(expected);
    });

    it('calls storage update', function () {
      expect(markCueAsVisited.callCount).to.equal(3);

      expect(markCueAsVisited.firstCall.args).to.deep.equal([
        cue1.cueId,
        cue1.groupId,
      ]);
      expect(markCueAsVisited.secondCall.args).to.deep.equal([
        cue2.cueId,
        cue2.groupId,
      ]);
      expect(markCueAsVisited.thirdCall.args).to.deep.equal([
        cue3.cueId,
        cue3.groupId,
      ]);
    });

    it('sets active properties to null', function () {
      expect((guideCueService as any)._activeCue).to.be.null;
      expect((guideCueService as any)._activeGroupId).to.be.null;
    });
  });

  context('handles cue when its intersection changed', function () {
    const cue1 = { cueId: 'one', step: 1, isIntersecting: true };
    const cue2 = { cueId: 'two', step: 1, isIntersecting: true };
    const cue3 = { cueId: 'three', step: 1, isIntersecting: true };

    beforeEach(function () {
      guideCueService.addCue(cue1 as any);
      guideCueService.addCue(cue2 as any);
      guideCueService.addCue(cue3 as any);

      expect((guideCueService as any)._activeCue).to.deep.equal({
        ...cue1,
        isVisited: false,
      });
    });

    it('update cue intersection property', function () {
      guideCueService.onCueIntersectionChange(false, cue3.cueId);

      expect((guideCueService as any)._cues).to.deep.equal([
        { ...cue1, isVisited: false },
        { ...cue2, isVisited: false },
        { ...cue3, isVisited: false, isIntersecting: false },
      ]);
    });

    it('calls onNext if active cue is not intersection anymore', function () {
      const onNextSpy = Sinon.spy(guideCueService, 'onNext');
      guideCueService.onCueIntersectionChange(false, cue1.cueId);

      expect((guideCueService as any)._cues).to.deep.equal([
        { ...cue1, isVisited: false, isIntersecting: false },
        { ...cue2, isVisited: false },
        { ...cue3, isVisited: false },
      ]);

      expect(onNextSpy.calledOnce).to.be.true;
    });

    it('calls onNext if new cue is intersecting and there is no active cue', function () {
      // Set all cues to not intersecting
      guideCueService.onCueIntersectionChange(false, cue1.cueId);
      guideCueService.onCueIntersectionChange(false, cue2.cueId);
      guideCueService.onCueIntersectionChange(false, cue3.cueId);

      const expected = [cue1, cue2, cue3].map((x) => ({
        ...x,
        isVisited: false,
        isIntersecting: false,
      }));
      expect((guideCueService as any)._cues).to.deep.equal(expected);

      const onNextSpy = Sinon.spy(guideCueService, 'onNext');

      // set cue 2 to intersecting
      guideCueService.onCueIntersectionChange(true, cue2.cueId);

      expect(onNextSpy.callCount).to.equal(1);
    });
  });

  context('when disabled', function () {
    const initialValue = process.env.DISABLE_GUIDE_CUES;
    before(function () {
      process.env.DISABLE_GUIDE_CUES = 'true';

      guideCueService.addCue({ cueId: '1', isIntersecting: true, step: 1 });
      guideCueService.addCue({
        cueId: '3',
        groupId: 'abc',
        isIntersecting: true,
        step: 1,
      });
      guideCueService.addCue({
        cueId: '4',
        groupId: 'abc',
        isIntersecting: true,
        step: 2,
      });
    });

    after(function () {
      process.env.DISABLE_GUIDE_CUES = initialValue;
    });

    it('does not add a cue', function () {
      expect((guideCueService as any)._cues.length).to.equal(0);
    });

    it('returns undefined on onNext', function () {
      const next = guideCueService.onNext();
      expect(next).to.be.undefined;
    });
  });
});
