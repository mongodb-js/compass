import keytar from 'keytar';

/**
 * The account name.
 */
const ACCOUNT = 'compass-security-settings';

/**
 * Load the trust settings from secure storage.
 *
 * @param {String} service - The service name.
 *
 * @returns {Promise} The promise.
 */
const load = (service) => {
  return keytar.getPassword(service, ACCOUNT).then((trust) => {
    if (trust) return JSON.parse(trust);
    return {};
  });
};

/**
 * Save trust settings.
 *
 * @param {String} service - The service name.
 * @param {Object} trust - The trust settings.
 *
 * @returns {Promis} The promise.
 */
const save = (service, trust) => {
  return keytar.setPassword(service, ACCOUNT, JSON.stringify(trust));
};

/**
 * Remove the trust settings.
 *
 * @param {String} service - The service name.
 *
 * @returns {Promis} The promise.
 */
const remove = (service) => {
  return keytar.deletePassword(service, ACCOUNT);
};

export default load;
export { load, save, remove };
