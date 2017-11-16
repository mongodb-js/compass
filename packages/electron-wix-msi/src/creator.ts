import * as fs from 'fs-extra';
import * as path from 'path';
import * as klaw from 'klaw';
import * as uuid from 'uuid/v4';

import { replaceInFile, replaceInString } from './replacer';
import { Component, ComponentRef, Directory, DirectoryRef } from './interfaces';

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
}

export class MSICreator {
  private files: Array<string> = [];
  private directories: Array<string> = [];
  private components: Array<Component> = [];
  private componentRefs: Array<ComponentRef> = [];
  private directoryRefs: Array<DirectoryRef> = [];

  public readonly appDirectory: string;
  public readonly outputDirectory: string;
  public readonly exe: string;
  public readonly description: string;
  public readonly version: string;
  public readonly name: string;
  public readonly shortName: string;
  public readonly upgradeCode: string;
  public readonly manufacturer: string;
  public readonly language: number;

  constructor(options: MSICreatorOptions) {
    this.appDirectory = options.appDirectory;
    this.outputDirectory = options.outputDirectory;
    this.exe = options.exe.replace(/\.exe$/, '');
    this.description = options.description;
    this.version = options.version;
    this.name = options.name;
    this.upgradeCode = options.upgradeCode || uuid();
    this.manufacturer = options.manufacturer;
    this.language = options.language || 1033;
    this.shortName = options.shortName || options.name;

    console.log(this.appDirectory);
  }

  public async create() {
    const { files, directories } = await this.getDirectoryStructure();

    this.files = files;
    this.directories = directories;
    this.components = await this.getComponents();
    this.componentRefs = await this.getComponentRefs();

    await this.createWxs();
  }

  private async createWxs() {
    const template = path.join(__dirname, '../static/wix.wxs');
    const target = path.join(this.outputDirectory, `${this.exe}.wxs`);
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
      '<!-- {{Components}} -->': this.components.map(({ xml }) => xml).join('\n'),
      '<!-- {{ComponentRefs}} -->': this.componentRefs.map(({ xml }) => xml).join('\n')
    }

    await replaceInFile(template, target, replacements);
  }

  // private async getDirectories(): Promise<Array<Directory>> {
  //   const templateSrc = path.join(__dirname, '../static/component-ref.xml');
  //   const template = await fs.readFile(templateSrc, 'utf-8');
  //   const directories = this.directories;


  // }

  /**
   * Creates Wix <ComponentRefs> for all components.
   *
   * @returns {Promise<Array<string>>}
   */
  private async getComponentRefs(): Promise<Array<ComponentRef>> {
    const templateSrc = path.join(__dirname, '../static/component-ref.xml');
    const template = await fs.readFile(templateSrc, 'utf-8');

    return this.components.map(({ id }) => {
      const xml = replaceInString(template, {
        '{{FileId}}': id
      });

      return { id, xml };
    });
  }

  /**
   * Creates Wix <Components> for all files.
   *
   * @returns {Promise<Array<string>>}
   */
  private async getComponents(): Promise<Array<Component>> {
    const templateSrc = path.join(__dirname, '../static/component.xml');
    const template = await fs.readFile(templateSrc, 'utf-8');

    return this.files.map((file) => {
      const guid = uuid();
      const id = this.getFileId(file);
      const xml = replaceInString(template, {
        '{{FileId}}': id,
        '{{Guid}}': guid,
        '{{SourcePath}}': file
      });

      return { guid, id, xml, file }
    });
  }

  /**
   * Walks over the app directory and returns two arrays of paths,
   * one for files and another one for directories
   *
   * @returns {Promise<{ files: Array<string>, directories: Array<string> }>}
   */
  private getDirectoryStructure(): Promise<{ files: Array<string>, directories: Array<string> }> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.appDirectory)) {
        return reject(new Error(`App directory ${this.appDirectory} does not exist`));
      }

      const files: Array<string> = [];
      const directories: Array<string> = [];

      klaw(this.appDirectory)
        .on('data', (item) => {
          if (item.stats.isFile()) {
            files.push(item.path)
          } else {
            directories.push(item.path);
          }
        })
        .on('end', () => resolve({ files, directories }));
    });
  }

  private getFileId(filePath: string) {
    const pathId = filePath
      .replace(this.appDirectory, '')
      .replace(/^\\|\//g, '');
    const id = (pathId.length > 72)
      ? `${path.basename(filePath).slice(0, 35)}_${uuid()}`
      : pathId;

    return id.replace(/[^A-Za-z0-9_\.]/g, '_');
  }
}