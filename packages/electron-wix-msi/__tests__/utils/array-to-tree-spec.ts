import { separator as S } from '../../src/utils/separator';
import { addFilesToTree, arrayToTree, isChild, isDirectChild } from '../../src/utils/array-to-tree';
import { defaultsDeep, cloneDeep } from 'lodash';

const mockFolders = [
  `slack${S}resources`,
  `slack${S}resources${S}app.asar.unpacked`,
  `slack${S}resources${S}app.asar.unpacked${S}node_modules`,
  `slack${S}resources${S}app.asar.unpacked${S}src`,
  `slack${S}locales`
];

const mockFiles = [
  `slack${S}slack.exe`,
  `slack${S}resources${S}text.txt`,
  `slack${S}resources${S}app.asar.unpacked${S}image.png`,
  `slack${S}resources${S}app.asar.unpacked${S}node_modules${S}package.json`,
  `slack${S}resources${S}app.asar.unpacked${S}src${S}package.json`,
  `slack${S}locales${S}de-DE.json`,
  `slack${S}locales${S}en-US.json`,
];

const mockFolderTree = {
  __ELECTRON_WIX_MSI_PATH__: `slack`,
  __ELECTRON_WIX_MSI_FILES__: [],
  resources: {
    __ELECTRON_WIX_MSI_PATH__: `slack${S}resources`,
    __ELECTRON_WIX_MSI_FILES__: [],
    'app.asar.unpacked': {
      __ELECTRON_WIX_MSI_PATH__: `slack${S}resources${S}app.asar.unpacked`,
      __ELECTRON_WIX_MSI_FILES__: [],
      node_modules: {
        __ELECTRON_WIX_MSI_PATH__: `slack${S}resources${S}app.asar.unpacked${S}node_modules`,
        __ELECTRON_WIX_MSI_FILES__: []
      },
      src: {
        __ELECTRON_WIX_MSI_PATH__: `slack${S}resources${S}app.asar.unpacked${S}src`,
        __ELECTRON_WIX_MSI_FILES__: []
      }
    }
  },
  locales: {
    __ELECTRON_WIX_MSI_PATH__: `slack${S}locales`,
    __ELECTRON_WIX_MSI_FILES__: []
  }
};

const mockFolderFileTree = defaultsDeep(cloneDeep(mockFolderTree), {
  __ELECTRON_WIX_MSI_FILES__: [{ name: `slack.exe`, path: `slack${S}slack.exe` }],
  resources: {
    __ELECTRON_WIX_MSI_FILES__: [{ name: `text.txt`, path: `slack${S}resources${S}text.txt` }],
    'app.asar.unpacked': {
      __ELECTRON_WIX_MSI_FILES__: [
        { name: `image.png`, path: `slack${S}resources${S}app.asar.unpacked${S}image.png` },
      ],
      node_modules: {
        __ELECTRON_WIX_MSI_FILES__: [
          { name: `package.json`, path: `slack${S}resources${S}app.asar.unpacked${S}node_modules${S}package.json` }
        ]
      },
      src: {
        __ELECTRON_WIX_MSI_FILES__: [
          { name: `package.json`, path: `slack${S}resources${S}app.asar.unpacked${S}src${S}package.json` }
        ]
      }
    }
  },
  locales: {
    __ELECTRON_WIX_MSI_FILES__: [
      { name: `de-DE.json`, path: `slack${S}locales${S}de-DE.json` },
      { name: `en-US.json`, path: `slack${S}locales${S}en-US.json` }
    ]
  }
});

test(`isChild() returns true for a child and parent`, () => {
  const a = `C:${S}my${S}path`;
  const b = `C:${S}my${S}path${S}child`;

  expect(isChild(a, b)).toBeTruthy;
});

test(`isChild() returns false for a child and non-parent`, () => {
  const a = `C:${S}my${S}path`;
  const b = `C:${S}my${S}other${S}path${S}child`;

  expect(isChild(a, b)).toBeFalsy;
});

test(`isDirectChild() returns true for a child and direct parent`, () => {
  const a = `C:${S}my${S}path`;
  const b = `C:${S}my${S}path${S}child`;

  expect(isDirectChild(a, b)).toBeTruthy;
});

test(`isDirectChild() returns false for a child and non-direct parent`, () => {
  const a = `C:${S}my${S}path`;
  const b = `C:${S}my${S}path${S}child${S}ren`;

  expect(isDirectChild(a, b)).toBeFalsy;
});

test(`isDirectChild() returns false for a child and non-parent`, () => {
  const a = `C:${S}my${S}path`;
  const b = `C:${S}my${S}other${S}path${S}child`;

  expect(isDirectChild(a, b)).toBeFalsy;
});

test(`arrayToTree() creates a tree structure`, () => {
  expect(arrayToTree(mockFolders, `slack`)).toEqual(mockFolderTree);
});

test(`addFilesToTree() adds files to a tree structure`, () => {
  expect(addFilesToTree(mockFolderTree, mockFiles, `slack`)).toEqual(mockFolderFileTree);
});
