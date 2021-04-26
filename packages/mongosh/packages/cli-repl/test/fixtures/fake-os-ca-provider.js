let fn;
module.exports = (...args) => fn(...args);
module.exports.setFn = (newFn) => { fn = newFn; };
