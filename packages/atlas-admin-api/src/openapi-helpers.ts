import type { operations } from '../openapi/v2';
import type { DefaultVersion } from '../openapi/default-version';

type Content<Op extends keyof operations> =
  operations[Op]['responses'] extends {
    200: { content: infer C };
  }
    ? C
    : never;

/** Stable resource versions an operation can be requested at (`Accept: application/vnd.atlas.<version>+json`). */
export type Versions<Op extends keyof operations> =
  keyof Content<Op> extends infer K
    ? K extends `application/vnd.atlas.${infer V}+json`
      ? V extends 'preview'
        ? never
        : V
      : never
    : never;

/** Version an operation resolves to when the request does not pin one. */
export type DefaultVersionOf<Op extends keyof operations> = Extract<
  DefaultVersion[Op & keyof DefaultVersion],
  Versions<Op>
>;

/** 200 response body of an operation at a given version; defaults to the version the default `Accept` header resolves to. */
export type Response<
  Op extends keyof operations,
  V extends Versions<Op> = DefaultVersionOf<Op>
> = Content<Op>[`application/vnd.atlas.${V}+json` & keyof Content<Op>];
