module.exports = function (app) {
  return async function (fileSelector, filePath) {
    const { client } = app;

    // HACK: the <input type="file"> is not displayed so we can't interact
    // with it until we change that.
    await client.execute((selector) => {
      // eslint-disable-next-line no-undef
      const f = document.querySelector(selector);
      f.removeAttribute('style');
    }, fileSelector);

    // select the file
    const fileInput = await client.$(fileSelector);
    await fileInput.setValue(filePath);

    // HACK: undo what we just did
    await client.execute((selector) => {
      // eslint-disable-next-line no-undef
      const f = document.querySelector(selector);
      f.setAttribute('style', 'display: none');
    }, fileSelector);
  };
};
