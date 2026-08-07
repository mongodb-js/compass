export const ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE = 100;

export type AtlasPaginationOptions = {
  pageNum?: number;
  itemsPerPage?: number;
};

export type AtlasPaginatedResponse<T> = {
  results: T[];
  totalCount: number;
};

export function buildPaginationQuery(
  pagination?: AtlasPaginationOptions
): string {
  const params = new URLSearchParams();
  if (pagination?.pageNum !== undefined) {
    params.set('pageNum', String(pagination.pageNum));
  }
  if (pagination?.itemsPerPage !== undefined) {
    params.set('itemsPerPage', String(pagination.itemsPerPage));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function assertPaginatedResponse<T>(
  json: unknown
): asserts json is AtlasPaginatedResponse<T> {
  if (
    json &&
    typeof json === 'object' &&
    Array.isArray((json as { results?: unknown }).results) &&
    typeof (json as { totalCount?: unknown }).totalCount === 'number'
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API paginated request'
  );
}
