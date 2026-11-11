import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { commonConnectionItemActions } from './item-actions';

const connectionInfo: ConnectionInfo = {
  id: 'conn_1',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

const folders = [
  { id: 'folder_a', name: 'Alpha' },
  { id: 'folder_b', name: 'Beta' },
];

function findAction(
  actions: ReturnType<typeof commonConnectionItemActions>,
  action: string
) {
  return actions.find((item) => 'action' in item && item.action === action);
}

function findMoveTo(actions: ReturnType<typeof commonConnectionItemActions>) {
  return actions.find((item) => 'label' in item && item.label === 'Move to…');
}

describe('commonConnectionItemActions', function () {
  it('does not show folder actions when there are no folders', function () {
    const actions = commonConnectionItemActions({ connectionInfo });
    expect(findMoveTo(actions)).to.be.undefined;
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });

  it('lists all folders for an uncategorized connection', function () {
    const actions = commonConnectionItemActions({ connectionInfo, folders });
    const moveTo = findMoveTo(actions);
    expect(moveTo)
      .to.have.nested.property('actions')
      .that.deep.equals([
        {
          action: 'move-to-folder',
          label: 'Alpha',
          actionPayload: { folderId: 'folder_a' },
        },
        {
          action: 'move-to-folder',
          label: 'Beta',
          actionPayload: { folderId: 'folder_b' },
        },
        { action: 'add-to-new-folder', label: 'New folder…' },
      ]);
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });

  it('excludes the current folder and offers removal', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      folders,
      folderId: 'folder_a',
    });
    const moveTo = findMoveTo(actions);
    expect(moveTo)
      .to.have.nested.property('actions')
      .that.deep.equals([
        {
          action: 'move-to-folder',
          label: 'Beta',
          actionPayload: { folderId: 'folder_b' },
        },
        { action: 'add-to-new-folder', label: 'New folder…' },
      ]);
    expect(findAction(actions, 'remove-from-folder')).to.exist;
  });

  it('hides "Move to" when the only folder is the current one', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      folders: [folders[0]],
      folderId: 'folder_a',
    });
    expect(findMoveTo(actions)).to.be.undefined;
    expect(findAction(actions, 'remove-from-folder')).to.exist;
  });

  it('does not show folder actions for Atlas connections', function () {
    const actions = commonConnectionItemActions({
      connectionInfo: {
        ...connectionInfo,
        atlasMetadata: {} as NonNullable<ConnectionInfo['atlasMetadata']>,
      },
      folders,
      folderId: 'folder_a',
    });
    expect(findMoveTo(actions)).to.be.undefined;
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });
});
