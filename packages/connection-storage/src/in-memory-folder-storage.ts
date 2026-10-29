import type {
  Folder,
  FolderAssignment,
  FolderStorage,
  FolderAssignmentStorage,
} from './folder-storage';

export class InMemoryFolderStorage implements FolderStorage {
  private folders: Folder[];

  constructor(folders: Folder[] = []) {
    this.folders = [...folders];
  }

  loadAll(): Promise<Folder[]> {
    return Promise.resolve(this.folders);
  }

  save({ folder }: { folder: Folder }): Promise<void> {
    const existingFolderIdx = this.folders.findIndex((f) => f.id === folder.id);
    if (existingFolderIdx !== -1) {
      const existingFolder = this.folders[existingFolderIdx];
      this.folders.splice(existingFolderIdx, 1, {
        ...existingFolder,
        ...folder,
      });
    } else {
      this.folders.push(folder);
    }
    return Promise.resolve();
  }

  delete({ id }: { id: string }): Promise<void> {
    const existingFolderIdx = this.folders.findIndex((f) => f.id === id);
    if (existingFolderIdx !== -1) {
      this.folders.splice(existingFolderIdx, 1);
    }
    return Promise.resolve();
  }
}

export class InMemoryFolderAssignmentStorage implements FolderAssignmentStorage {
  private assignments: FolderAssignment[];

  constructor(assignments: FolderAssignment[] = []) {
    this.assignments = [...assignments];
  }

  loadAll(): Promise<FolderAssignment[]> {
    return Promise.resolve(this.assignments);
  }

  private _findIdx({
    itemType,
    itemId,
  }: Pick<FolderAssignment, 'itemType' | 'itemId'>) {
    return this.assignments.findIndex(
      (assignment) =>
        assignment.itemType === itemType && assignment.itemId === itemId
    );
  }

  save({ assignment }: { assignment: FolderAssignment }): Promise<void> {
    const existingAssignmentIdx = this._findIdx(assignment);
    if (existingAssignmentIdx !== -1) {
      const existingAssignment = this.assignments[existingAssignmentIdx];
      this.assignments.splice(existingAssignmentIdx, 1, {
        ...existingAssignment,
        ...assignment,
      });
    } else {
      this.assignments.push(assignment);
    }
    return Promise.resolve();
  }

  delete({
    itemType,
    itemId,
  }: {
    itemType: FolderAssignment['itemType'];
    itemId: string;
  }): Promise<void> {
    const existingAssignmentIdx = this._findIdx({ itemType, itemId });
    if (existingAssignmentIdx !== -1) {
      this.assignments.splice(existingAssignmentIdx, 1);
    }
    return Promise.resolve();
  }
}
