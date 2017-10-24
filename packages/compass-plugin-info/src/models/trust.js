/**
 * The core plugin name prefix.
 */
const CORE = '@mongodb-js';

/**
 * Determine if a plugin is trusted.
 *
 * @param {Object} metadata - The plugin metadata.
 * @param {Object} trust - The trust settings.
 *
 * @returns {Boolean} If the plugin is trusted.
 */
const isTrusted = (metadata, trust) => {
  const name = metadata.name;
  if (name.startsWith(CORE) || trust[name]) {
    return true;
  }
  return false;
};

export default isTrusted;
export { isTrusted };
