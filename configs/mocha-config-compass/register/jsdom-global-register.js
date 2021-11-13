if (typeof window === 'undefined') {
  require('jsdom-global/register');

  window.requestAnimationFrame = function (callback) {
    return setTimeout(callback, 1);
  };
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}
