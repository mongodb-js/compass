module.exports = function (app, page) {
  return async function (fileSelector, filePath) {
    // HACK: the <input type="file"> is not displayed so we can't interact
    // with it until we change that.
    await page.evaluate((selector) => {
      // eslint-disable-next-line no-undef
      const f = document.querySelector(selector);
      f.removeAttribute('style');
    }, fileSelector);

    // select the file
    await page.setInputFiles(fileSelector, filePath);

    // HACK: undo what we just did
    await page.evaluate((selector) => {
      // eslint-disable-next-line no-undef
      const f = document.querySelector(selector);
      f.setAttribute('style', 'display: none');
    }, fileSelector);
  };
};
