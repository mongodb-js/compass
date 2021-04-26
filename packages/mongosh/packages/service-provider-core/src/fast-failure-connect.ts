// It probably makes sense to put this into its own package/repository once
// other tools start using it.

export function isFastFailureConnectionError(error: Error) {
  switch (error.name) {
    case 'MongoNetworkError':
      return /\b(ECONNREFUSED|ENOTFOUND|ENETUNREACH)\b/.test(error.message);
    case 'MongoError':
      return /The apiVersion parameter is required/.test(error.message);
    default:
      return false;
  }
}
