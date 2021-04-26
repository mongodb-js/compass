/* eslint-disable complexity */
import Help from './help';
import {
  Topologies,
  ALL_PLATFORMS,
  ALL_TOPOLOGIES,
  ALL_SERVER_VERSIONS,
  shellApiType,
  asPrintable,
  namespaceInfo
} from './enums';
import { MongoshInternalError } from '@mongosh/errors';
import type { ReplPlatform } from '@mongosh/service-provider-core';
import { addHiddenDataProperty } from './helpers';

const addSourceToResultsSymbol = Symbol.for('@@mongosh.addSourceToResults');
const resultSource = Symbol.for('@@mongosh.resultSource');

export interface ShellApiInterface {
  [shellApiType]: string;
  [asPrintable]?: () => any;
  serverVersions?: [string, string];
  topologies?: Topologies[];
  help?: Help;
  [key: string]: any;
}

export interface Namespace {
  db: string;
  collection: string;
}

export interface ShellResultSourceInformation {
  namespace: Namespace;
}

export interface ShellResult {
  /// The original result of the evaluation, as it would be stored e.g. as a
  /// variable inside the shell.
  rawValue: any;

  /// A version of the raw value that is usable for printing, e.g. what the
  /// shell would print.
  printable: any;

  /// The type of the shell result. This refers to built-in shell types, e.g.
  /// `Cursor`; all unknown object types and primitives are given the
  /// type `null`.
  type: string | null;

  /// Optional information about the original data source of the result.
  source?: ShellResultSourceInformation;
}

export class ShellApiClass implements ShellApiInterface {
  help: any;
  get [shellApiType](): string {
    throw new MongoshInternalError('Shell API Type did not use decorators');
  }
  set [shellApiType](value: string) {
    addHiddenDataProperty(this, shellApiType, value);
  }
  [asPrintable](): any {
    if (Array.isArray(this)) {
      return [...this];
    }
    return { ...this };
  }
}

export function getShellApiType(rawValue: any): string | null {
  return (rawValue && rawValue[shellApiType]) ?? null;
}

export async function toShellResult(rawValue: any): Promise<ShellResult> {
  if ((typeof rawValue !== 'object' && typeof rawValue !== 'function') || rawValue === null) {
    return {
      type: null,
      rawValue: rawValue,
      printable: rawValue
    };
  }

  if ('then' in rawValue && typeof rawValue.then === 'function') {
    // Accepting Promises for the actual values here makes life a bit easier
    // in the Java shell.
    return toShellResult(await rawValue);
  }

  const printable =
    typeof rawValue[asPrintable] === 'function' ? await rawValue[asPrintable]() : rawValue;
  const source = rawValue[resultSource] ?? undefined;

  return {
    type: getShellApiType(rawValue),
    rawValue: rawValue,
    printable: printable,
    source: source
  };
}

// For classes like Collection, it can be useful to attach information to the
// result about the original data source, so that downstream consumers of the
// shell can e.g. figure out how to edit a document returned from the shell.
// To that end, we wrap the methods of a class, and report back how the
// result was generated.
// We also attach the `shellApiType` property to the
// return type (if that is possible and they are not already present), so that
// we can also provide sensible information for methods that do not return
// shell classes, like db.coll.findOne() which returns a Document (i.e. a plain
// JavaScript object).
function wrapWithAddSourceToResult(fn: Function): Function {
  function addSource<T extends {}>(result: T, obj: any): T {
    if (typeof result === 'object' && result !== null) {
      const resultSourceInformation: ShellResultSourceInformation = {
        namespace: obj[namespaceInfo](),
      };
      addHiddenDataProperty(result, resultSource, resultSourceInformation);
      if ((result as any)[shellApiType] === undefined && (fn as any).returnType) {
        addHiddenDataProperty(result, shellApiType, (fn as any).returnType);
      }
    }
    return result;
  }
  const wrapper = (fn as any).returnsPromise ?
    markImplicitlyAwaited(async function(this: any, ...args: any[]): Promise<any> {
      return addSource(await fn.call(this, ...args), this);
    }) : function(this: any, ...args: any[]): any {
      return addSource(fn.call(this, ...args), this);
    };
  Object.setPrototypeOf(wrapper, Object.getPrototypeOf(fn));
  Object.defineProperties(wrapper, Object.getOwnPropertyDescriptors(fn));
  return wrapper;
}

export interface TypeSignature {
  type: string;
  hasAsyncChild?: boolean;
  serverVersions?: [ string, string ];
  topologies?: Topologies[];
  returnsPromise?: boolean;
  deprecated?: boolean;
  returnType?: string | TypeSignature;
  attributes?: { [key: string]: TypeSignature };
}

interface Signatures {
  [key: string]: TypeSignature;
}
const signaturesGlobalIdentifier = '@@@mdb.signatures@@@';
if (!(global as any)[signaturesGlobalIdentifier]) {
  (global as any)[signaturesGlobalIdentifier] = {};
}

const signatures: Signatures = (global as any)[signaturesGlobalIdentifier];
signatures.Document = { type: 'Document', attributes: {} };

type ClassSignature = {
  type: string;
  hasAsyncChild: boolean;
  returnsPromise: boolean;
  deprecated: boolean;
  attributes: {
    [methodName: string]: {
      type: 'function';
      serverVersions: [ string, string ];
      topologies: Topologies[];
      returnType: ClassSignature;
      returnsPromise: boolean;
      deprecated: boolean;
      platforms: ReplPlatform[];
    }
  };
};

type ClassHelp = {
  help: string;
  docs: string;
  attr: { name: string; description: string }[];
};

export const toIgnore = ['constructor'];
export function shellApiClassDefault(constructor: Function): void {
  const className = constructor.name;
  const classHelpKeyPrefix = `shell-api.classes.${className}.help`;
  const classHelp: ClassHelp = {
    help: `${classHelpKeyPrefix}.description`,
    docs: `${classHelpKeyPrefix}.link`,
    attr: []
  };
  const classSignature: ClassSignature = {
    type: className,
    hasAsyncChild: constructor.prototype.hasAsyncChild || false,
    returnsPromise: constructor.prototype.returnsPromise || false,
    deprecated: constructor.prototype.deprecated || false,
    attributes: {}
  };

  const classAttributes = Object.getOwnPropertyNames(constructor.prototype);
  for (const propertyName of classAttributes) {
    const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName);
    const isMethod = descriptor?.value && typeof descriptor.value === 'function';
    if (
      !isMethod ||
      toIgnore.includes(propertyName) ||
      propertyName.startsWith('_')
    ) continue;
    let method: any = (descriptor as any).value;

    if ((constructor as any)[addSourceToResultsSymbol]) {
      method = wrapWithAddSourceToResult(method);
    }

    method.serverVersions = method.serverVersions || ALL_SERVER_VERSIONS;
    method.topologies = method.topologies || ALL_TOPOLOGIES;
    method.returnType = method.returnType || { type: 'unknown', attributes: {} };
    method.returnsPromise = method.returnsPromise || false;
    method.deprecated = method.deprecated || false;
    method.platforms = method.platforms || ALL_PLATFORMS;

    classSignature.attributes[propertyName] = {
      type: 'function',
      serverVersions: method.serverVersions,
      topologies: method.topologies,
      returnType: method.returnType,
      returnsPromise: method.returnsPromise,
      deprecated: method.deprecated,
      platforms: method.platforms
    };

    const attributeHelpKeyPrefix = `${classHelpKeyPrefix}.attributes.${propertyName}`;
    const attrHelp = {
      help: `${attributeHelpKeyPrefix}.example`,
      docs: `${attributeHelpKeyPrefix}.link`,
      attr: [
        { description: `${attributeHelpKeyPrefix}.description` }
      ]
    };
    const aHelp = new Help(attrHelp);
    method.help = (): Help => (aHelp);
    Object.setPrototypeOf(method.help, aHelp);

    classHelp.attr.push({
      name: propertyName,
      description: `${attributeHelpKeyPrefix}.description`
    });
    Object.defineProperty(constructor.prototype, propertyName, {
      ...descriptor,
      value: method
    });
  }

  const superClass = Object.getPrototypeOf(constructor.prototype);
  if (superClass.constructor.name !== 'ShellApiClass' && superClass.constructor !== Array) {
    const superClassHelpKeyPrefix = `shell-api.classes.${superClass.constructor.name}.help`;
    for (const propertyName of Object.getOwnPropertyNames(superClass)) {
      const descriptor = Object.getOwnPropertyDescriptor(superClass, propertyName);
      const isMethod = descriptor?.value && typeof descriptor.value === 'function';
      if (
        classAttributes.includes(propertyName) ||
        !isMethod ||
        toIgnore.includes(propertyName) ||
        propertyName.startsWith('_')
      ) continue;
      const method: any = (descriptor as any).value;

      classSignature.attributes[propertyName] = {
        type: 'function',
        serverVersions: method.serverVersions,
        topologies: method.topologies,
        returnType: method.returnType,
        returnsPromise: method.returnsPromise,
        deprecated: method.deprecated,
        platforms: method.platforms
      };

      const attributeHelpKeyPrefix = `${superClassHelpKeyPrefix}.attributes.${propertyName}`;

      classHelp.attr.push({
        name: propertyName,
        description: `${attributeHelpKeyPrefix}.description`
      });
    }
  }
  const help = new Help(classHelp);
  constructor.prototype.help = (): Help => (help);
  Object.setPrototypeOf(constructor.prototype.help, help);
  constructor.prototype[asPrintable] =
    constructor.prototype[asPrintable] ||
    ShellApiClass.prototype[asPrintable];
  addHiddenDataProperty(constructor.prototype, shellApiType, className);
  signatures[className] = classSignature;
}

function markImplicitlyAwaited<T extends(...args: any) => Promise<any>>(orig: T): ((...args: Parameters<T>) => Promise<any>) {
  function wrapper(this: any, ...args: any[]) {
    const origResult = orig.call(this, ...args);
    return addHiddenDataProperty(origResult, Symbol.for('@@mongosh.syntheticPromise'), true);
  }
  Object.setPrototypeOf(wrapper, Object.getPrototypeOf(orig));
  Object.defineProperties(wrapper, Object.getOwnPropertyDescriptors(orig));
  return wrapper;
}

export { signatures };
export function serverVersions(versionArray: [ string, string ]): Function {
  return function(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    descriptor.value.serverVersions = versionArray;
  };
}
export function deprecated(_target: any, _propertyKey: string, descriptor: PropertyDescriptor): void {
  descriptor.value.deprecated = true;
}
export function topologies(topologiesArray: Topologies[]): Function {
  return function(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    descriptor.value.topologies = topologiesArray;
  };
}
export const nonAsyncFunctionsReturningPromises: string[] = []; // For testing.
export function returnsPromise(_target: any, _propertyKey: string, descriptor: PropertyDescriptor): void {
  const orig = descriptor.value;
  orig.returnsPromise = true;
  descriptor.value = markImplicitlyAwaited(descriptor.value);
  if (orig.constructor.name !== 'AsyncFunction') {
    nonAsyncFunctionsReturningPromises.push(orig.name);
  }
}
export function directShellCommand(_target: any, _propertyKey: string, descriptor: PropertyDescriptor): void {
  descriptor.value.isDirectShellCommand = true;
}
export function returnType(type: string | TypeSignature): Function {
  return function(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    descriptor.value.returnType = type;
  };
}
export function hasAsyncChild(constructor: Function): void {
  constructor.prototype.hasAsyncChild = true;
}
export function classReturnsPromise(constructor: Function): void {
  constructor.prototype.returnsPromise = true;
}
export function classDeprecated(constructor: Function): void {
  constructor.prototype.deprecated = true;
}
export function platforms(platformsArray: any[]): Function {
  return function(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    descriptor.value.platforms = platformsArray;
  };
}
export function classPlatforms(platformsArray: any[]): Function {
  return function(constructor: Function): void {
    constructor.prototype.platforms = platformsArray;
  };
}
export function addSourceToResults(constructor: Function): void {
  (constructor as any)[addSourceToResultsSymbol] = true;
}
