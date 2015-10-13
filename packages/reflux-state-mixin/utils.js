var utils = {};

utils.object = function (keys, vals) {
    var o = {}, i = 0;
    for (; i < keys.length; i++) {
        o[keys[i]] = vals[i];
    }
    return o;
};

utils.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

utils.extend = function (obj) {
    if (!utils.isObject(obj)) {
        return obj;
    }
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
                var propertyDescriptor = Object.getOwnPropertyDescriptor(source, prop);
                Object.defineProperty(obj, prop, propertyDescriptor);
            } else {
                obj[prop] = source[prop];
            }
        }
    }
    return obj;
};

utils.isFunction = function (value) {
    return typeof value === 'function';
};

module.exports = utils;
