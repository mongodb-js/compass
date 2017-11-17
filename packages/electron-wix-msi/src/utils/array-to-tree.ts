import { File, FileFolderTree, StringMap } from '../interfaces';
import * as path from 'path';
import { cloneDeep } from 'lodash';

/**
 * Are two paths in a direct parent/child relationship?
 *
 * Direct:
 * /my/path
 * /my/path/child
 *
 * Indirect:
 * /my/path
 * /my/path/child/indirect
 *
 * Not at all:
 * /my/path
 * /my/otherpath
 *
 * @export
 * @param {string} parent
 * @param {string} possibleChild
 * @returns {boolean}
 */
export function isDirectChild(parent: string, possibleChild: string): boolean {
  if (!isChild(parent, possibleChild)) return false;

  const parentSplit = parent.split('\\');
  const childSplit = possibleChild.split('\\');

  return (parentSplit.length === childSplit.length - 1);
}

/**
 * Are two paths in a parent/child relationship?
 *
 * Relationship:
 * /my/path
 * /my/path/child
 *
 * /my/path
 * /my/path/child/indirect
 *
 * No relationship:
 * /my/path
 * /my/otherpath
 *
 * @export
 * @param {string} parent
 * @param {string} possibleChild
 * @returns {boolean}
 */
export function isChild(parent: string, possibleChild: string): boolean {
  return possibleChild.startsWith(parent) && parent !== possibleChild;
}

/**
 * Returns the shortest string in an array of strings
 *
 * @export
 * @param {Array<string>} input
 * @returns {string}
 */
export function shortestString(input: Array<string>): string {
  return input.reduce((a, b) => a.length <= b.length ? a : b)
}

/**
 * Turns an array of paths into a directory structure.
 *
 *   input = [
 *     'slack\\resources',
 *     'slack\\resources\\app.asar.unpacked',
 *     'slack\\resources\\app.asar.unpacked\\node_modules',
 *     'slack\\resources\\app.asar.unpacked\\src',
 *     'slack\\locales'
 *   ];
 *
 *  output = {
 *    __ELECTRON_WIX_MSI_FILES__: [],
 *    resources: {
 *      __ELECTRON_WIX_MSI_FILES__: [],
 *      'app.asar.unpacked': {
 *        __ELECTRON_WIX_MSI_FILES__: [],
 *        node_modules: { __ELECTRON_WIX_MSI_FILES__: [] },
 *        src: { __ELECTRON_WIX_MSI_FILES__: [] }
 *      }
 *    },
 *    locales: { __ELECTRON_WIX_MSI_FILES__: [] }
 *  }
 *
 * @export
 * @param {Array<string>} input
 * @param {string} [inputRoot]
 * @returns {FileFolderTree}
 */
export function arrayToTree(input: Array<string>, inputRoot?: string): FileFolderTree {
  const root = inputRoot || shortestString(input);
  const output: FileFolderTree = { __ELECTRON_WIX_MSI_FILES__: [], __ELECTRON_WIX_MSI_PATH__: root };

  const children: Array<string> = input.filter((e) => isChild(root, e));
  const directChildren: Array<string> = children.filter((e) => isDirectChild(root, e));

  directChildren.forEach((directChild) => {
    output[path.basename(directChild)] = arrayToTree(children, directChild)
  });

  return output;
}

export function addFilesToTree(tree: FileFolderTree, files: Array<string>, root: string): FileFolderTree {
  const output: FileFolderTree = cloneDeep(tree);

  files.forEach((filepath) => {
    const file: File = { name: path.basename(filepath), path: filepath };
    const walkingSteps = filepath.split('\\');
    let target: FileFolderTree = output;

    if (walkingSteps[0] === root) {
      walkingSteps.splice(0, 1);
    }

    walkingSteps.forEach((step, i) => {
      if (target[step] && i < walkingSteps.length - 1) {
        target = target[step] as FileFolderTree;
        return;
      }

      if (i === walkingSteps.length - 1) {
        target.__ELECTRON_WIX_MSI_FILES__.push(file);
      }
    });
  })

  return output;
}