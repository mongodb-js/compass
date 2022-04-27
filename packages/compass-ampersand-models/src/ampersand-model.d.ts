declare module 'ampersand-model' {
  type WeHaveEventEmitterAtHome = {
    emit(name: string, ...args: unknown[]): void;
    on(name: string, fn: (...args: unknown[]) => unknown): void;
    off(): void;
    off(name: string, fn: (...args: unknown[]) => unknown): void;
    removeListener(name: string, fn: (...args: unknown[]) => unknown): void;
  };
  // eslint-disable-next-line @typescript-eslint/ban-types
  type EmptyObject = {};
  type AnyObject = Record<string, unknown>;

  type AmpersandType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object'
    | 'date'
    | 'any';

  type TypeFromAmpersandType<Type extends string> = Type extends 'string'
    ? string
    : Type extends 'number'
    ? number
    : Type extends 'boolean'
    ? boolean
    : Type extends 'array'
    ? unknown[]
    : Type extends 'object'
    ? AnyObject
    : Type extends 'date'
    ? Date
    : Type extends 'any'
    ? any
    : never;

  interface AmpersandPropertyDefinition {
    type: AmpersandType;
    required?: boolean;
    default?: unknown;
    values?: readonly unknown[];
  }

  type AmpersandProperty = AmpersandType | AmpersandPropertyDefinition;

  type MaybeUndefinedProperty<T, Prop = AmpersandProperty> = Prop extends string
    ? T | null | undefined
    : Prop extends { type: AmpersandType; required: true }
    ? T
    : T | null | undefined;

  type AmpersandPropertyType<Prop = AmpersandProperty> = MaybeUndefinedProperty<
    Prop extends string
      ? TypeFromAmpersandType<Prop>
      : Prop extends { type: string; values: (infer Values)[] }
      ? Values
      : Prop extends { type: string }
      ? TypeFromAmpersandType<Prop['type']>
      : never,
    Prop
  >;

  type AmpersandDerivedPropertyDefinition = {
    deps: readonly string[];
    fn(): unknown;
  };

  type AmpersandDerivedPropertyType<Prop = AmpersandDerivedPropertyDefinition> =
    Prop extends { fn(): infer T } ? T : never;

  type AmpersandModelProperties<Props, Session, Derived> = {
    readonly [key in keyof Props]: AmpersandPropertyType<Props[key]>;
  } &
    { readonly [key in keyof Session]: AmpersandPropertyType<Session[key]> } &
    {
      readonly [key in keyof Derived]: AmpersandDerivedPropertyType<
        Derived[key]
      >;
    };

  type AmpersandChildModelProperties<Children, Collections> =
    (Children extends Record<
      string,
      AmpersandModelConstructor<
        infer _Props,
        infer _Session,
        infer _Derived,
        infer _Children,
        infer _Collections
      >
    >
      ? {
          readonly [key in keyof Children]: AmpersandModelInstance<
            _Props,
            _Session,
            _Derived,
            _Children,
            _Collections
          >;
        }
      : EmptyObject) &
      (Collections extends Record<
        string,
        AmpersandCollectionConstructor<infer Model>
      >
        ? {
            readonly [key in keyof Collections]: AmpersandCollectionInstance<Model>;
          }
        : EmptyObject);

  export type AmpersandModelInstance<
    Props = unknown,
    Session = unknown,
    Derived = unknown,
    Children = unknown,
    Collections = unknown,
    ExtendedProps = EmptyObject,
    Properties = AmpersandModelProperties<Props, Session, Derived> &
      AmpersandChildModelProperties<Children, Collections>
  > = WeHaveEventEmitterAtHome &
    Properties & {
      get<Name extends keyof Properties>(name: Name): Properties[Name];
      set(
        object: Partial<Properties>
      ): AmpersandModelInstance<
        Props,
        Session,
        Derived,
        Children,
        Collections,
        ExtendedProps
      >;
      set<Name extends keyof Properties>(
        name: Name,
        value: Properties[Name]
      ): AmpersandModelInstance<
        Props,
        Session,
        Derived,
        Children,
        Collections,
        ExtendedProps
      >;
      getId(): string;
      getType(): string;
      parent?: AmpersandModelInstance;
      collection?: AmpersandCollectionInstance;
      isState: true;
      isCollection?: undefined;
      cid: string;
      serialize<Opts extends SerializeOptions = EmptyObject>(
        opts?: Opts
      ): AmpersandModelProperties<
        Props,
        Opts extends { session: true } ? Session : EmptyObject,
        Opts extends { derived: true } ? Derived : EmptyObject
      > &
        AmpersandChildModelProperties<Children, Collections>;
    } & ExtendedProps;

  type AmpersandModelOptions = {
    modelType?: string;
    idAttribute?: string;
    initialize?: () => void;
    props?: Record<string, AmpersandProperty>;
    session?: Record<string, AmpersandProperty>;
    derived?: Record<string, AmpersandDerivedPropertyDefinition>;
    children?: Record<string, AmpersandModelConstructor>;
    collections?: Record<string, AmpersandCollectionConstructor>;
  } & AnyObject;

  type AmpersandModelExtendedProperties<Opts> = Omit<
    Opts,
    | 'modelType'
    | 'idAttribute'
    | 'initialize'
    | 'props'
    | 'session'
    | 'derived'
    | 'children'
    | 'collections'
  >;

  export interface AmpersandModelConstructor<
    Props = unknown,
    Session = unknown,
    Derived = unknown,
    Children = unknown,
    Collections = unknown,
    ExtendedProps = EmptyObject
  > {
    new (props?: unknown): AmpersandModelInstance<
      Props,
      Session,
      Derived,
      Children,
      Collections,
      ExtendedProps
    >;
    extend<O1 extends AmpersandModelOptions = AmpersandModelOptions>(
      o1: O1
    ): AmpersandModelConstructor<
      O1['props'],
      O1['session'],
      O1['derived'],
      O1['children'],
      O1['collections'],
      AmpersandModelExtendedProperties<O1>
    >;
    extend<
      O1 extends AmpersandModelOptions = AmpersandModelOptions,
      O2 extends AmpersandModelOptions = AmpersandModelOptions
    >(
      o1: O1,
      o2: O2
    ): AmpersandModelConstructor<
      O1['props'] & O2['props'],
      O1['session'] & O2['session'],
      O1['derived'] & O2['derived'],
      O1['children'] & O2['children'],
      O1['collections'] & O2['collections'],
      AmpersandModelExtendedProperties<O2 & Omit<O1, keyof O2>>
    >;
    extend<
      O1 extends AmpersandModelOptions = AmpersandModelOptions,
      O2 extends AmpersandModelOptions = AmpersandModelOptions,
      O3 extends AmpersandModelOptions = AmpersandModelOptions
    >(
      o1: O1,
      o2: O2,
      o3: O3
    ): AmpersandModelConstructor<
      O1['props'] & O2['props'] & O3['props'],
      O1['session'] & O2['session'] & O3['session'],
      O1['derived'] & O2['derived'] & O3['derived'],
      O1['children'] & O2['children'] & O3['children'],
      O1['collections'] & O2['collections'] & O3['collections'],
      AmpersandModelExtendedProperties<
        O3 & Omit<O2, keyof O3> & Omit<O1, keyof O3 | keyof O2>
      >
    >;
  }

  type SerializeOptions = { session?: boolean; derived?: boolean } | undefined;

  export type AmpersandModelPropertiesFromConstructor<
    Ctor,
    Opts extends SerializeOptions = EmptyObject
  > = Ctor extends AmpersandModelConstructor<
    infer Props,
    infer Session,
    infer Derived,
    infer Children,
    infer Collections
  >
    ? AmpersandModelProperties<
        Props,
        Opts extends { session: true } ? Session : EmptyObject,
        Opts extends { derived: true } ? Derived : EmptyObject
      > &
        AmpersandChildModelProperties<Children, Collections>
    : never;

  export type AmpersandCollectionInstance<
    Ctor extends
      | AmpersandModelConstructor
      | undefined = AmpersandModelConstructor,
    ExtendedProps = EmptyObject,
    ModelInstanceType = InstanceType<
      Ctor extends AmpersandModelConstructor
        ? Ctor
        : { new (...args: unknown[]): unknown }
    >,
    ModelInstanceProperties = AmpersandModelPropertiesFromConstructor<
      Ctor,
      { session: true }
    >
  > = WeHaveEventEmitterAtHome &
    Pick<
      Array<ModelInstanceType>,
      | 'indexOf'
      | 'lastIndexOf'
      | 'every'
      | 'some'
      | 'forEach'
      | 'map'
      | 'filter'
      | 'reduce'
      | 'reduceRight'
    > & {
      get(query: unknown): ModelInstanceType | undefined;
      at(index: number): ModelInstanceType | undefined;
      add(models: Partial<ModelInstanceType | ModelInstanceProperties>[]): void;
      set(models: Partial<ModelInstanceType | ModelInstanceProperties>[]): void;
      remove(
        models: Partial<ModelInstanceType | ModelInstanceProperties>[]
      ): void;
      reset(
        models?: Partial<ModelInstanceType | ModelInstanceProperties>[]
      ): void;
      parent?: AmpersandModelInstance;
      collection?: AmpersandCollectionInstance;
      isCollection: true;
      isState?: undefined;
      serialize(
        opts?: SerializeOptions
      ): AmpersandModelPropertiesFromConstructor<Ctor, typeof opts>[];
    } & ExtendedProps;

  type AmpersandCollectionOptions = {
    mainIndex?: string;
    indexes?: string[];
    comparator?: boolean | string | ((...args: unknown[]) => number);
    model?: AmpersandModelConstructor;
  } & AnyObject;

  type AmpersandCollectionExtendedProperties<Opts> = Omit<
    Opts,
    'mainIndex' | 'indexes' | 'comparator' | 'model'
  >;

  export interface AmpersandCollectionConstructor<
    Ctor extends
      | AmpersandModelConstructor
      | undefined = AmpersandModelConstructor,
    ExtendedProps = EmptyObject
  > {
    new (props?: unknown): AmpersandCollectionInstance<Ctor, ExtendedProps>;
    extend<O1 extends AmpersandCollectionOptions = AmpersandCollectionOptions>(
      o1: O1
    ): AmpersandCollectionConstructor<
      O1['model'],
      AmpersandCollectionExtendedProperties<O1>
    >;
    extend<
      O1 extends AmpersandCollectionOptions = AmpersandCollectionOptions,
      O2 extends AmpersandCollectionOptions = AmpersandCollectionOptions
    >(
      o1: O1,
      o2: O2
    ): AmpersandCollectionConstructor<
      O2['model'] extends AmpersandModelConstructor ? O2['model'] : O1['model'],
      AmpersandCollectionExtendedProperties<O2 & Omit<O1, keyof O2>>
    >;
    extend<
      O1 extends AmpersandCollectionOptions = AmpersandCollectionOptions,
      O2 extends AmpersandCollectionOptions = AmpersandCollectionOptions,
      O3 extends AmpersandCollectionOptions = AmpersandCollectionOptions
    >(
      o1: O1,
      o2: O2,
      o3: O3
    ): AmpersandCollectionConstructor<
      O3['model'] extends AmpersandModelConstructor
        ? O3['model']
        : O2['model'] extends AmpersandModelConstructor
        ? O2['model']
        : O1['model'],
      AmpersandCollectionExtendedProperties<
        O3 & Omit<O2, keyof O1> & Omit<O3, keyof O1 | keyof O2>
      >
    >;
  }

  const Model: AmpersandModelConstructor;

  export default Model;
}
