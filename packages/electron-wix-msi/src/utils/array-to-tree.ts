import * as path from 'path';
import { cloneDeep } from 'lodash';

import { separator } from './separator';
import { File, FileFolderTree, StringMap } from '../interfaces';

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

  const parentSplit = parent.split(separator);
  const childSplit = possibleChild.split(separator);

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
 * Turns an array of paths into a directory structure.
 *
 *   input = [
 *     'slack\\resources',
 *     'slack\\resources\\app.asar.unpacked',
 *     'slack\\locales'
 *   ];
 *
 *  output = {
 *    __ELECTRON_WIX_MSI_PATH__: 'slack',
 *    __ELECTRON_WIX_MSI_FILES__: [],
 *    resources: {
 *      __ELECTRON_WIX_MSI_PATH__: 'slack\\resources',
 *      __ELECTRON_WIX_MSI_FILES__: [],
 *      'app.asar.unpacked': {
 *        __ELECTRON_WIX_MSI_PATH__: 'slack\\resources\\app.asar.unpacked',
 *        __ELECTRON_WIX_MSI_FILES__: [],
 *      }
 *    },
 *    locales: {
 *      __ELECTRON_WIX_MSI_PATH__: 'slack\\locales',
 *      __ELECTRON_WIX_MSI_FILES__: []
 *    }
 *  }
 *
 * @export
 * @param {Array<string>} input
 * @param {string} [inputRoot]
 * @returns {FileFolderTree}
 */
export function arrayToTree(input: Array<string>, root: string): FileFolderTree {
  const output: FileFolderTree = { __ELECTRON_WIX_MSI_FILES__: [], __ELECTRON_WIX_MSI_PATH__: root };
  const children: Array<string> = input.filter((e) => isChild(root, e));
  const directChildren: Array<string> = children.filter((e) => isDirectChild(root, e));

  directChildren.forEach((directChild) => {
    output[path.basename(directChild)] = arrayToTree(children, directChild)
  });

  return output;
}

/**
 * Adds files to a FileFolderTree.
 *
 *  tree = {
 *    __ELECTRON_WIX_MSI_FILES__: [],
 *    resources: { __ELECTRON_WIX_MSI_FILES__: [] },
 *    locales: { __ELECTRON_WIX_MSI_FILES__: [] }
 *  }
 *
 *  files = [
 *    'slack\\slack.exe',
 *    'slack\\resources\\text.txt',
 *    'slack\\locales\\de-DE.json',
 *    'slack\\locales\\en-US.json',
 *  ]
 *
 *  output = {
 *    __ELECTRON_WIX_MSI_PATH__: 'slack',
 *    __ELECTRON_WIX_MSI_FILES__: [{ name: 'slack.exe', path: 'slack\\slack.exe' }],
 *    resources: {
 *      __ELECTRON_WIX_MSI_PATH__: 'slack\\resources',
 *      __ELECTRON_WIX_MSI_FILES__: [{ name: 'text.txt', path: 'slack\\resources\\text.txt' }],
 *    },
 *    locales: {
 *      __ELECTRON_WIX_MSI_PATH__: 'slack\\locales',
 *      __ELECTRON_WIX_MSI_FILES__: [
 *        { name: 'de-DE.json', path: 'slack\\locales\\de-DE.json' },
 *        { name: 'en-US.json', path: 'slack\\locales\\en-US.json' }
 *      ]
 *    }
 *  }
 *
 * @export
 * @param {FileFolderTree} tree
 * @param {Array<string>} files
 * @param {string} root
 * @returns {FileFolderTree}
 */
export function addFilesToTree(tree: FileFolderTree, files: Array<string>, root: string): FileFolderTree {
  const output: FileFolderTree = cloneDeep(tree);

  files.forEach((filepath) => {
    const file: File = { name: path.basename(filepath), path: filepath };
    const walkingSteps = filepath.split(separator);
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