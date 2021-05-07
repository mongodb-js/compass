export interface StringMap<T> {
  [key: string]: T;
}

export interface Component {
  file: File;
  guid: string;
  componentId: string;
  xml: string;
}

export interface ComponentRef {
  componentId: string;
  xml: string;
}

export interface Directory {
  id: string;
  xml: string;
  path: string;
  name: string;
  children: Array<Directory>;
  files: Array<string>;
}

export interface FileFolderTree {
  [key: string]: FileFolderTree | Array<File> | string;
  __ELECTRON_WIX_MSI_FILES__: Array<File>;
  __ELECTRON_WIX_MSI_PATH__: string;
}

export interface File {
  name: string;
  path: string;
}
