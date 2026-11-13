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
  return actions.find(
    (item) => 'label' in item && item.label === 'Move to folder'
  );
}

/** Nested actions reduced to the fields under test (icons don't deep-equal). */
function nestedActions(
  actions: ReturnType<typeof commonConnectionItemActions>
) {
  const moveTo = findMoveTo(actions);
  if (!moveTo || !('actions' in moveTo) || !moveTo.actions) {
    return undefined;
  }
  return moveTo.actions.map((item) =>
    'separator' in item
      ? item
      : {
          action: item.action,
          label: item.label,
          ...(item.actionPayload ? { actionPayload: item.actionPayload } : {}),
        }
  );
}

describe('commonConnectionItemActions', function () {
  it('hides folder actions when folders are disabled', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      folders,
      folderId: 'folder_a',
    });
    expect(findMoveTo(actions)).to.be.undefined;
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });

  it('shows a single "new folder" action when there are no folders', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      isFoldersEnabled: true,
    });
    expect(nestedActions(actions)).to.deep.equal([
      { action: 'add-to-new-folder', label: 'New folder' },
    ]);
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
    expect(actions[actions.length - 1]).not.to.have.property('separator');
  });

  it('lists all folders for an uncategorized connection', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      isFoldersEnabled: true,
      folders,
    });
    expect(nestedActions(actions)).to.deep.equal([
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
      { separator: true },
      { action: 'add-to-new-folder', label: 'New folder' },
    ]);
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });

  it('excludes the current folder and offers removal', function () {
    const actions = commonConnectionItemActions({
      connectionInfo,
      isFoldersEnabled: true,
      folders,
      folderId: 'folder_a',
    });
    expect(nestedActions(actions)).to.deep.equal([
      {
        action: 'move-to-folder',
        label: 'Beta',
        actionPayload: { folderId: 'folder_b' },
      },
      { separator: true },
      { action: 'add-to-new-folder', label: 'New folder' },
    ]);
    expect(findAction(actions, 'remove-from-folder')).to.exist;
  });

  it('does not show folder actions for Atlas connections', function () {
    const actions = commonConnectionItemActions({
      connectionInfo: {
        ...connectionInfo,
        atlasMetadata: {} as NonNullable<ConnectionInfo['atlasMetadata']>,
      },
      isFoldersEnabled: true,
      folders,
      folderId: 'folder_a',
    });
    expect(findMoveTo(actions)).to.be.undefined;
    expect(findAction(actions, 'remove-from-folder')).to.be.undefined;
  });
});
