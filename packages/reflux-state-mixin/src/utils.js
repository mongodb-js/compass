//var utils = {};

export function object(keys, vals) {
    var o = {}, i = 0;
    for (; i < keys.length; i++) {
        o[keys[i]] = vals[i];
    }
    return o;
}

function isObject (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}
export function setProp(obj, source, prop){
    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(source, prop);
        Object.defineProperty(obj, prop, propertyDescriptor);
    } else {
        obj[prop] = source[prop];
    }
    return obj;
}

export function extend (obj) {
    if (!isObject(obj)) {
        return obj;
    }
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            obj = setProp(obj, source, prop)
        }
    }
    return obj;
}

export function isFunction (value) {
    return typeof value === 'function';
}

//module.exports = utils;
