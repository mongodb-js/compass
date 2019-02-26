import result from 'lodash.result';
import clone from 'lodash.clone';
import wrapError from './wrap-error';
import raf from 'raf';

export default {
  fetch: function(options) {
    const model = this;
    const url = result(model, 'url');

    options = options ? clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }

    const success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) {
        return false;
      }
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync', model, resp, options);
    };

    wrapError(this, options);

    const done = function(err, res) {
      if (err) {
        return options.error({}, 'error', err.message);
      }
      raf(function onClientSuccess() {
        options.success(res, 'success', res);
      });
    };

    options.dataService.get(url, options, done);
  }
};
