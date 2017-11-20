import { spawnPromise } from './utils/spawn';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as uuid from 'uuid/v4';
import { padStart } from 'lodash';

import { hasLight, hasCandle } from './utils/detect-wix';
import { replaceToFile, replaceInString } from './utils/replace';
import { arrayToTree, addFilesToTree } from './utils/array-to-tree';
import { getDirectoryStructure } from './utils/walker';
import { Component, ComponentRef, Directory, File, FileFolderTree, StringMap } from './interfaces';

const getTemplate = (name: string) => fs.readFileSync(path.join(__dirname, `../static/${name}.xml`), 'utf-8');
const ROOTDIR_NAME = 'APPLICATIONROOTDIRECTORY';
const debug = require('debug')('electron-wix-msi');

export interface MSICreatorOptions {
  appDirectory: string;
  outputDirectory: string;
  exe: string;
  description: string;
  version: string;
  name: string;
  shortName?: string;
  upgradeCode?: string;
  manufacturer: string;
  language?: number;
  programFilesFolderName?: string;
  shortcutFolderName?: string;
  ui?: UIOptions | boolean;
}

export interface UIOptions {
  chooseDirectory?: boolean;
  template?: string;
  images?: UIImages;
}

export interface UIImages {
  background?: string;        // WixUIDialogBmp
  banner?: string;            // WixUIBannerBmp
  exclamationIcon?: string;   // WixUIExclamationIco
  infoIcon?: string;          // WixUIInfoIco
  newIcon?: string;           // WixUINewIco
  upIcon?: string;            // WixUIUpIco
}

export class MSICreator {
  private files: Array<string> = [];
  private directories: Array<string> = [];
  private tree: FileFolderTree;
  private components: Array<Component> = [];

  // Default Templates
  public componentTemplate = getTemplate('component');
  public componentRefTemplate = getTemplate('component-ref');
  public directoryTemplate = getTemplate('directory');
  public wixTemplate = getTemplate('wix');
  public uiTemplate = getTemplate('ui');
  public uiDirTemplate = getTemplate('ui-choose-dir');
  public propertyTemplate = getTemplate('property');

  // State, overwritable beteween steps
  public wxsFile: string = '';

  // Configuration
  public appDirectory: string;
  public outputDirectory: string;
  public exe: string;
  public description: string;
  public version: string;
  public name: string;
  public shortName: string;
  public upgradeCode: string;
  public manufacturer: string;
  public language: number;
  public programFilesFolderName: string;
  public shortcutFolderName: string;
  public ui: UIOptions | boolean;

  constructor(options: MSICreatorOptions) {
    this.appDirectory = path.normalize(options.appDirectory);
    this.outputDirectory = options.outputDirectory;
    this.exe = options.exe.replace(/\.exe$/, '');
    this.description = options.description;
    this.version = options.version;
    this.name = options.name;
    this.upgradeCode = options.upgradeCode || uuid();
    this.manufacturer = options.manufacturer;
    this.language = options.language || 1033;
    this.shortName = options.shortName || options.name;
    this.programFilesFolderName = options.programFilesFolderName || options.name;
    this.shortcutFolderName = options.shortcutFolderName || options.manufacturer;
    this.ui = options.ui || true;
  }

  /**
   * Analyzes the structure of the app directory and collects necessary
   * information for creating a .wxs file. Then, creates the file and returns
   * both the location as well as the content.
   *
   * @returns {Promise<{ wxsFile: string, wxsContent: string }>}
   */
  public async create(): Promise<{ wxsFile: string, wxsContent: string }> {
    const { files, directories } = await getDirectoryStructure(this.appDirectory);

    this.files = files;
    this.directories = directories;
    this.tree = this.getTree();

    const { wxsContent, wxsFile } = await this.createWxs();
    this.wxsFile = wxsFile;

    return { wxsContent, wxsFile };
  }

  /**
   * Creates a wixObj file and kicks of actual compilation into an MSI.
   * "Guidance is internal" (https://youtu.be/8wdF8nchVMk?t=108)
   */
  public async compile() {
    const light = hasLight();
    const candle = hasCandle();

    if (!light || !light.has || !candle || !candle.has) {
      console.warn(`It appears that electron-wix-msi cannot find candle.exe or light.exe.`);
      console.warn(`Please consult the readme at https://github.com/felixrieseberg/electron-wix-msi`);
      console.warn(`for information on how to install the Wix toolkit, which is required.\n`);

      throw new Error(`Could not find light.exe or candle.exe`);
    } else {
      console.log(`electron-wix-msi: Using light.exe (${light.version}) and candle.exe (${candle.version})`);
    }

    if (!this.wxsFile) {
      throw new Error(`wxsFile not found. Did you run create() yet?`);
    }

    const { wixobjFile } = await this.createWixobj();
    const { msiFile } = await this.createMsi();

    return { wixobjFile, msiFile };
  }

  /**
   * Kicks of creation of a .wxs file and returns both content
   * and location.
   *
   * @returns {Promise<{ wxsFile: string, wxsContent: string }>}
   */
  private async createWxs(): Promise<{ wxsFile: string, wxsContent: string }> {
    const target = path.join(this.outputDirectory, `${this.exe}.wxs`);
    const base = path.basename(this.appDirectory);
    const directories = await this.getDirectoryForTree(
      this.tree, base, 8, ROOTDIR_NAME, this.programFilesFolderName);
    const componentRefs = await this.getComponentRefs();
    const replacements = {
      '{{ApplicationName}}': this.name,
      '{{UpgradeCode}}': this.upgradeCode,
      '{{Version}}': this.version,
      '{{Manufacturer}}': this.manufacturer,
      '{{Language}}': this.language.toString(10),
      '{{ApplicationDescription}}': this.description,
      '{{ApplicationBinary}}': this.exe,
      '{{ApplicationShortName}}': this.shortName,
      '{{ApplicationShortcutGuid}}': uuid(),
      '{{ShortcutFolderName}}': this.shortcutFolderName,
      '<!-- {{Directories}} -->': directories,
      '<!-- {{ComponentRefs}} -->': componentRefs.map(({ xml }) => xml).join('\n'),
      '<!-- {{UI}} -->': this.getUI()
    }

    const output = await replaceToFile(this.wixTemplate, target, replacements);

    return { wxsFile: target, wxsContent: output };
  }

  /**
   * Creates a wixobj file.
   *
   * @returns {Promise<{ wixobjFile: string }>}
   */
  private async createWixobj(): Promise<{ wixobjFile: string }> {
    return { wixobjFile: await this.createFire('wixobj') };
  }

  /**
   * Creates a msi file
   *
   * @returns {Promise<{ msiFile: string }>}
   */
  private async createMsi(): Promise<{ msiFile: string }> {
    return { msiFile: await this.createFire('msi') };
  }

  /**
   * Uses light.exe or candle.exe to create a wixobj or msi file.
   *
   * @param {('wixobj' | 'msi')} type
   * @returns {Promise<string>} - The created file
   */
  private async createFire(type: 'wixobj' | 'msi'): Promise<string> {
    const cwd = path.dirname(this.wxsFile);
    const expectedObj = path.join(cwd, `${path.basename(this.wxsFile, '.wxs')}.${type}`);
    const binary = type === 'msi'
      ? 'light.exe'
      : 'candle.exe';
    const input = type === 'msi'
      ? path.join(cwd, `${path.basename(this.wxsFile, '.wxs')}.wixobj`)
      : this.wxsFile;
    const preArgs = this.ui
      ? [ '-ext', 'WixUIExtension' ]
      : [];

    const { code, stderr, stdout } = await spawnPromise(binary, [ ...preArgs, input ], {
      env: process.env,
      cwd
    });

    if (code === 0 && fs.existsSync(expectedObj)) {
      return expectedObj;
    } else {
      throw new Error(`Could not create ${type} file. Code: ${code} StdErr: ${stderr} StdOut: ${stdout}`);
    }
  }

  /**
   * Creates the XML portion for a Wix UI, if enabled.
   *
   * @returns {string}
   */
  private getUI(): string {
    let xml = '';

    if (this.ui) {
      xml = this.uiTemplate;
    }

    if (typeof this.ui === 'object' && this.ui !== 'null') {
      const { images, template, chooseDirectory } = this.ui;
      const propertiesXml = this.getUIProperties();
      const uiTemplate = template || chooseDirectory
        ? this.uiDirTemplate
        : this.uiTemplate

      xml = replaceInString(uiTemplate, {
        '<!-- {{Properties}} -->': propertiesXml
      });
    }

    return xml;
  }

  private getUIProperties() {
    if (typeof this.ui !== 'object' || !this.ui.images) return '';

    const { images } = this.ui;
    const propertyMap: StringMap<string> = {
      background: 'WixUIDialogBmp',
      banner: 'WixUIBannerBmp',
      exclamationIcon: 'WixUIExclamationIco',
      infoIcon: 'WixUIInfoIco',
      newIcon: 'WixUINewIco',
      upIcon: 'WixUIUpIco'
    };

    return Object.keys(images)
      .map((key) => {
        return propertyMap[key]
          ? replaceInString(this.propertyTemplate, {
              '{{Key}}': propertyMap[key],
              '{{Value}}': (images as any)[key]
            })
          : ''
      })
      .join('\n');
  }

  /**
   * Creates the XML component for Wix <Directory> elements,
   * including children
   *
   * @param {FileFolderTree} tree
   * @param {string} treePath
   * @param {number} [indent=0]
   * @returns {string}
   */
  private getDirectoryForTree(tree: FileFolderTree, treePath: string, indent: number = 0, id?: string, name?: string): string {
    const childDirectories = Object.keys(tree)
      .filter((k) => !k.startsWith('__ELECTRON_WIX_MSI'))
      .map((k) => {
        return this.getDirectoryForTree(
          tree[k] as FileFolderTree,
          (tree[k] as FileFolderTree).__ELECTRON_WIX_MSI_PATH__,
          indent + 2
        )}
      );
    const childFiles = tree.__ELECTRON_WIX_MSI_FILES__
      .map((file) => {
        const component = this.getComponent(file, indent + 2);
        this.components.push(component);
        return component.xml;
      });

    const children: string = [childDirectories.join('\n'), childFiles.join('\n')].join('');

    return replaceInString(this.directoryTemplate, {
      '<!-- {{I}} -->': indent > 0 ? padStart('', indent) : '',
      '{{DirectoryId}}': id || this.getComponentId(treePath),
      '{{DirectoryName}}': name || path.basename(treePath),
      '<!-- {{Children}} -->': children
    });
  }

  /**
   * Get a FileFolderTree for all files that need to be installed.
   *
   * @returns {FileFolderTree}
   */
  private getTree(): FileFolderTree {
    const root = this.appDirectory;
    const folderTree = arrayToTree(this.directories, root);
    const fileFolderTree = addFilesToTree(folderTree, this.files, root);

    return fileFolderTree;
  }

  /**
   * Creates Wix <ComponentRefs> for all components.
   *
   * @returns {Promise<Array<string>>}
   */
  private getComponentRefs(indent: number = 6): Array<ComponentRef> {
    return this.components.map(({ componentId }) => {
      const xml = replaceInString(this.componentRefTemplate, {
        '<!-- {{I}} -->': indent > 0 ? padStart('', indent) : '',
        '{{ComponentId}}': componentId
      });

      return { componentId, xml };
    });
  }

  /**
   * Creates Wix <Components> for all files.
   *
   * @param {File}
   * @returns {Component}
   */
  private getComponent(file: File, indent: number = 0): Component {
    const guid = uuid();
    const componentId = this.getComponentId(file.path);
    const xml = replaceInString(this.componentTemplate, {
      '<!-- {{I}} -->': indent > 0 ? padStart('', indent) : '',
      '{{ComponentId}}': componentId,
      '{{FileId}}': componentId,
      '{{Name}}': file.name,
      '{{Guid}}': guid,
      '{{SourcePath}}': file.path
    });

    return { guid, componentId, xml, file }
  }

  /**
   * Creates a usable component id to use with Wix "id" fields
   *
   * @param {string} filePath
   * @returns {string} componentId
   */
  private getComponentId(filePath: string): string {
    const pathId = filePath
      .replace(this.appDirectory, '')
      .replace(/^\\|\//g, '');
    const id = (pathId.length > 72)
      ? `${path.basename(filePath).slice(0, 35)}_${uuid()}`
      : pathId;

    return id.replace(/[^A-Za-z0-9_\.]/g, '_');
  }
}
