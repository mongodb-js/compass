const fieldStringLen = (value) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};

module.exports = { fieldStringLen };
