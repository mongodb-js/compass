/**
 * Occurs when the input to the AtlasAiService is understood but invalid.
 */
class AtlasAiServiceInvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtlasAiServiceInvalidInputError';
  }
}

/**
 * Thrown when the API response cannot be parsed into the expected shape..
 */
class AtlasAiServiceApiResponseParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtlasAiServiceApiResponseParseError';
  }
}

class AtlasAiServiceGenAiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtlasAiServiceGenAiResponseError';
  }
}

export {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
  AtlasAiServiceGenAiResponseError,
};
