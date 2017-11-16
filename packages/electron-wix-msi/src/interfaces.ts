export interface StringMap<T> {
  [key: string]: T;
}

export interface Component {
  file: string;
  guid: string;
  id: string;
  xml: string;
}

export interface ComponentRef {
  id: string;
  xml: string;
}

export interface Directory {
  id: string;
  xml: string;
  path: string;
  name: string;
  children: Array<Directory>;
}

export interface DirectoryRef {
  id: string;
  xml: string;
  path: string;
  name: string;
  children: Array<DirectoryRef>;
}

