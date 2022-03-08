/* eslint-disable space-infix-ops */

/**
 * Create a helper function for accessing a component's class name.
 *
 * @param {Object} styles Dictionary of style -> postcss generated class name.
 * @param {String} prefix Component name prefix dasherized
 * @returns {Function}
 * @throws {TypeError} If the style is not found.
 *
 * @example
 * ```jsx
 * import styles from './progress-bar.module.less;
 * import createStyler from './styler.js';
 * const style = createStyler('progress-bar');
 *
 * const render = (props) => {
 *   return (
 *     <div className={style()}>
 *       <div className={style('bar')}>
 *         <div className={style('bar-message')}>{props.message}</div>
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export default function styler(styles, prefix) {
  // eslint-disable-next-line camelcase
  return function get_style_for_component(what = '') {
    const k = `${prefix}${what !== '' ? '-' + what : ''}`;
    const def = styles[k];
    if (!def) {
      throw new TypeError(`Style does not exist for ${k}`);
    }
    return def;
  };
}
