// eslint-disable-next-line no-undef
const userAgent = navigator.userAgent.toLowerCase();

/**
 * Action creator for opening links.
 *
 * @param {String} href - The link.
 *
 * @returns {Function} The open link function.
 */
export const openLink = (href) => {
  return () => {
    if (userAgent.indexOf('electron') > -1) {
      const { shell } = require('electron');
      shell.openExternal(href);
    } else {
      // eslint-disable-next-line no-undef
      window.open(href, '_new');
    }
  };
};
