/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type * as estypes from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { CoreSetup, CoreStart } from '@kbn/core/public';
import { ESSearchResponse } from '@kbn/core/types/elasticsearch';
import {
  enableInspectEsQueries,
  useEsSearch,
} from '@kbn/observability-plugin/public';
import { isString, startsWith } from 'lodash';
import LRU from 'lru-cache';
import hash from 'object-hash';
import { FetchOptions } from '../../../common/fetch_options';

function fetchOptionsWithDebug(
  fetchOptions: FetchOptions,
  inspectableEsQueriesEnabled: boolean
) {
  const debugEnabled =
    inspectableEsQueriesEnabled &&
    startsWith(fetchOptions.pathname, '/internal/apm');

  const { body, ...rest } = fetchOptions;

  return {
    ...rest,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    query: {
      ...fetchOptions.query,
      ...(debugEnabled ? { _inspect: true } : {}),
    },
  };
}

const cache = new LRU<string, any>({ max: 100, maxAge: 1000 * 60 * 60 });

export function clearCache() {
  cache.reset();
}

export type CallApi = typeof callApi;

function isBSearchCachable<TParams extends estypes.SearchRequest>(
  start?: string,
  end?: string,
  params?: TParams
) {
  if (!start && !end && !params) return false;

  return isString(end) && new Date(end).getTime() < Date.now();
}

function getBSearchRequestCacheKey(options: {
  params: estypes.SearchRequest;
  name: string;
  start?: string;
  end?: string;
}) {
  const { start, end, params, name } = options;
  if (!start || !end) return null;
  return hash({ start, end, params, name });
}

export function useCachedRequests<
  DocumentSource extends unknown,
  TParams extends estypes.SearchRequest
>(
  params: TParams,
  fnDeps: any[],
  options: { name: string },
  start?: string,
  end?: string
) {
  let cachedResponse:
    | ESSearchResponse<DocumentSource, TParams, { restTotalHitsAsInt: boolean }>
    | null
    | undefined = null;

  const cacheKey = getBSearchRequestCacheKey({
    params,
    name: options.name,
    start,
    end,
  });
  if (cacheKey !== null) {
    cachedResponse = cache.get(cacheKey);
  }

  if (cachedResponse) {
    params.index = undefined;
  }

  const { data, loading } = useEsSearch<DocumentSource, TParams>(
    params,
    fnDeps,
    options
  );

  if (
    !cachedResponse &&
    data &&
    cacheKey &&
    isBSearchCachable(start, end, params)
  ) {
    cache.set(cacheKey, data);
  }

  return {
    data: cachedResponse ?? data,
    loading: cachedResponse ? false : loading,
  };
}

export async function callApi<T = void>(
  { http, uiSettings }: CoreStart | CoreSetup,
  fetchOptions: FetchOptions
): Promise<T> {
  const inspectableEsQueriesEnabled: boolean = uiSettings.get(
    enableInspectEsQueries
  );
  const cacheKey = getCacheKey(fetchOptions);
  const cacheResponse = cache.get(cacheKey);
  if (cacheResponse) {
    return cacheResponse;
  }

  const {
    pathname,
    method = 'get',
    ...options
  } = fetchOptionsWithDebug(fetchOptions, inspectableEsQueriesEnabled);

  const lowercaseMethod = method.toLowerCase() as
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch';

  const res = await http[lowercaseMethod]<T>(pathname, options);

  if (isCachable(fetchOptions)) {
    cache.set(cacheKey, res);
  }

  return res;
}

// only cache items that has a time range with `start` and `end` params,
// and where `end` is not a timestamp in the future
function isCachable(fetchOptions: FetchOptions) {
  if (fetchOptions.isCachable !== undefined) {
    return fetchOptions.isCachable;
  }

  if (
    !(fetchOptions.query && fetchOptions.query.start && fetchOptions.query.end)
  ) {
    return false;
  }

  return (
    isString(fetchOptions.query.end) &&
    new Date(fetchOptions.query.end).getTime() < Date.now()
  );
}

// order the options object to make sure that two objects with the same arguments, produce the
// same cache key regardless of the order of properties
function getCacheKey(options: FetchOptions) {
  const { pathname, method, body, query, headers } = options;
  return hash({ pathname, method, body, query, headers });
}
