import { StringMap } from '../interfaces';
import * as path from 'path';

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
 *    resources: {
 *      'app.asar.unpacked': {
 *        node_modules: {},
 *        src: {}
 *      }
 *    },
 *    locales: {}
 *  }
 *
 * @export
 * @param {Array<string>} input
 * @param {string} [inputRoot]
 * @returns
 */
export function arrayToTree(input: Array<string>, inputRoot?: string) {
  const root = inputRoot || shortestString(input);
  const output: StringMap<any> = {};

  const children: Array<string> = input.filter((e) => isChild(root, e));
  const directChildren: Array<string> = children.filter((e) => isDirectChild(root, e));

  directChildren.forEach((directChild) => {
    output[path.basename(directChild)] = arrayToTree(children, directChild)
  });

  return output;
}