const userAgent = navigator.userAgent.toLowerCase();

/**
 * Action creator for opening links.
 *
 * @returns {Function} The open link function.
 */
export const openLink = (href) => {
  return () => {
    if (userAgent.indexOf('electron') > -1) {
      const { shell } = require('electron');
      shell.openExternal(href);
    } else {
      window.open(href, '_new');
    }
  };
};
