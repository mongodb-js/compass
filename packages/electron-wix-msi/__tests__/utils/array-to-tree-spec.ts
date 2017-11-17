import { addFilesToTree, arrayToTree, isChild, isDirectChild, shortestString } from '../../src/utils/array-to-tree';
import { defaultsDeep, cloneDeep } from 'lodash';

const mockFolders = [
  'slack\\resources',
  'slack\\resources\\app.asar.unpacked',
  'slack\\resources\\app.asar.unpacked\\node_modules',
  'slack\\resources\\app.asar.unpacked\\src',
  'slack\\locales'
];

const mockFiles = [
  'slack\\slack.exe',
  'slack\\resources\\text.txt',
  'slack\\resources\\app.asar.unpacked\\image.png',
  'slack\\resources\\app.asar.unpacked\\node_modules\\package.json',
  'slack\\resources\\app.asar.unpacked\\src\\package.json',
  'slack\\locales\\de-DE.json',
  'slack\\locales\\en-US.json',
];

const mockFolderTree = {
  __ELECTRON_WIX_MSI_PATH__: 'slack',
  __ELECTRON_WIX_MSI_FILES__: [],
  resources: {
    __ELECTRON_WIX_MSI_PATH__: 'slack\\resources',
    __ELECTRON_WIX_MSI_FILES__: [],
    'app.asar.unpacked': {
      __ELECTRON_WIX_MSI_PATH__: 'slack\\resources\\app.asar.unpacked',
      __ELECTRON_WIX_MSI_FILES__: [],
      node_modules: {
        __ELECTRON_WIX_MSI_PATH__: 'slack\\resources\\app.asar.unpacked\\node_modules',
        __ELECTRON_WIX_MSI_FILES__: []
      },
      src: {
        __ELECTRON_WIX_MSI_PATH__: 'slack\\resources\\app.asar.unpacked\\src',
        __ELECTRON_WIX_MSI_FILES__: []
      }
    }
  },
  locales: {
    __ELECTRON_WIX_MSI_PATH__: 'slack\\locales',
    __ELECTRON_WIX_MSI_FILES__: []
  }
};

const mockFolderFileTree = defaultsDeep(cloneDeep(mockFolderTree), {
  __ELECTRON_WIX_MSI_FILES__: [{ name: 'slack.exe', path: 'slack\\slack.exe' }],
  resources: {
    __ELECTRON_WIX_MSI_FILES__: [{ name: 'text.txt', path: 'slack\\resources\\text.txt' }],
    'app.asar.unpacked': {
      __ELECTRON_WIX_MSI_FILES__: [
        { name: 'image.png', path: 'slack\\resources\\app.asar.unpacked\\image.png' },
      ],
      node_modules: {
        __ELECTRON_WIX_MSI_FILES__: [
          { name: 'package.json', path: 'slack\\resources\\app.asar.unpacked\\node_modules\\package.json' }
        ]
      },
      src: {
        __ELECTRON_WIX_MSI_FILES__: [
          { name: 'package.json', path: 'slack\\resources\\app.asar.unpacked\\src\\package.json' }
        ]
      }
    }
  },
  locales: {
    __ELECTRON_WIX_MSI_FILES__: [
      { name: 'de-DE.json', path: 'slack\\locales\\de-DE.json' },
      { name: 'en-US.json', path: 'slack\\locales\\en-US.json' }
    ]
  }
});

test('isChild() returns true for a child and parent', () => {
  const a = 'C:\\my\\path';
  const b = 'C:\\my\\path\\child';

  expect(isChild(a, b)).toBe(true);
});

test('isChild() returns false for a child and non-parent', () => {
  const a = 'C:\\my\\path';
  const b = 'C:\\my\\other\\path\\child';

  expect(isChild(a, b)).toBe(false);
});

test('isDirectChild() returns true for a child and direct parent', () => {
  const a = 'C:\\my\\path';
  const b = 'C:\\my\\path\\child';

  expect(isDirectChild(a, b)).toBe(true);
});

test('isDirectChild() returns false for a child and non-direct parent', () => {
  const a = 'C:\\my\\path';
  const b = 'C:\\my\\path\\child\\ren';

  expect(isDirectChild(a, b)).toBe(false);
});

test('isDirectChild() returns false for a child and non-parent', () => {
  const a = 'C:\\my\\path';
  const b = 'C:\\my\\other\\path\\child';

  expect(isDirectChild(a, b)).toBe(false);
});

test('arrayToTree() creates a tree structure', () => {
  expect(arrayToTree(mockFolders, 'slack')).toEqual(mockFolderTree);
});

test('addFilesToTree() adds files to a tree structure', () => {
  expect(addFilesToTree(mockFolderTree, mockFiles, 'slack')).toEqual(mockFolderFileTree);
});
