import { type GroupName } from './guide-cue-groups';

export class UnregisteredGroupError extends Error {
  name = 'UnregisteredGroup';
  constructor(groupId: GroupName) {
    super(`Group ${groupId} not registered.`);
  }
}

export class GroupStepsCompleteError extends Error {
  name = 'GroupStepsComplete';
  constructor(groupId: GroupName, steps: number) {
    super(
      `Group ${groupId} has already ${steps} step(s). Can not add another one.`
    );
  }
}

export class InvalidCueStepError extends Error {
  name = 'InvalidCueStep';
  constructor(groupId: GroupName, steps: number, step: number) {
    super(
      `Group ${groupId} has only ${steps} steps. Can not add another with step:${step}.`
    );
  }
}

export class DuplicateCueStepError extends Error {
  name = 'DuplicateCueStep';
  constructor(groupId: GroupName, step: number) {
    super(`Group ${groupId} already has Cue with step ${step} registered.`);
  }
}
