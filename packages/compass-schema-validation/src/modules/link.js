const userAgent = navigator.userAgent.toLowerCase();

/**
 * Action creator for opening links.
 *
 * @param {Object} href - The link.
 *
 * @returns {Function} The open link function.
 */
export const openLink = (href) => () => {
  if (userAgent.indexOf('electron') > -1) {
    const { shell } = require('electron');

    shell.openExternal(href);
  } else {
    window.open(href, '_new');
  }
};
