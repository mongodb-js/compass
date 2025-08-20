import type {
  PolymorphicAs,
  PolymorphicPropsWithRef,
  PolymorphicRef,
} from '@leafygreen-ui/polymorphic';

// FIXME: Delete this once https://jira.mongodb.org/browse/LG-5354 is resolved

declare module '@leafygreen-ui/polymorphic' {
  export interface PolymorphicComponentType<
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- We must exactly match the exported type parameters
    XP = {},
    DefaultAs extends PolymorphicAs = PolymorphicAs
  > {
    <T extends PolymorphicAs = DefaultAs>(
      props: PolymorphicPropsWithRef<T, XP>,
      ref: PolymorphicRef<T>
    ): React.ReactElement | null;
  }
}
