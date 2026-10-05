const NBSP = '\u00A0';

function toNbsp(spaces: string): string {
  return spaces.replace(/\u0020/g, NBSP);
}

/**
 * Replace leading/trailing spaces and internal runs of 2+ spaces with
 * non-breaking spaces so the original text is preserved when rendered in the
 * DOM. Browsers collapse consecutive whitespace and strip edges, so a run of
 * N spaces renders as 1 (or 0 at edges). Single internal spaces are left as
 * regular spaces so the text can still wrap.
 */
export function nbsp(text: string): string {
  return text
    .replace(/^\u0020+|\u0020+$/g, toNbsp)
    .replace(/\u0020{2,}/g, toNbsp);
}
