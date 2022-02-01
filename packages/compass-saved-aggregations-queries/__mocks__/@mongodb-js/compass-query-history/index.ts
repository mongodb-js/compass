let queries = [];

export function _setQueries(newQueries = []): void {
  queries = newQueries;
}
export class FavoriteQueryStorage {
  loadAll(): Promise<typeof queries> {
    return Promise.resolve(queries);
  }
}
