import type { Argv, Arguments } from 'yargs';

export type ExcludeYargsRequiredArgs<T extends Arguments<unknown>> = {
  [K in keyof T as K extends '_' | '$0'
    ? never
    : string extends K
    ? never
    : K]: T[K];
};

export type BuilderCallbackParsedArgs<A extends (...args: any[]) => Argv<any>> =
  ReturnType<ReturnType<A>['parseSync']>;
