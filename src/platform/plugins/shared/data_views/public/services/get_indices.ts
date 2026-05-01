/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { sortBy } from 'lodash';
import type { HttpStart } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import type { Tag } from '../types';
import { INDEX_PATTERN_TYPE } from '../types';
import type { MatchedItem, ResolveIndexResponse } from '../types';
import { ResolveIndexResponseItemIndexAttrs } from '../types';
import { ALIAS_TAG_KEY, DATA_STREAM_TAG_KEY, FROZEN_TAG_KEY, INDEX_TAG_KEY } from './tag_keys';

const aliasLabel = i18n.translate('dataViews.aliasLabel', { defaultMessage: 'Alias' });
const dataStreamLabel = i18n.translate('dataViews.dataStreamLabel', {
  defaultMessage: 'Data stream',
});

const indexLabel = i18n.translate('dataViews.indexLabel', {
  defaultMessage: 'Index',
});

const frozenLabel = i18n.translate('dataViews.frozenLabel', {
  defaultMessage: 'Frozen',
});

const rollupLabel = i18n.translate('dataViews.rollupLabel', {
  defaultMessage: 'Rollup (deprecated)',
});

const getIndexTags = (isRollupIndex: (indexName: string) => boolean) => (indexName: string) =>
  isRollupIndex(indexName)
    ? [
        {
          key: INDEX_PATTERN_TYPE.ROLLUP,
          name: rollupLabel,
          color: 'warning',
        },
      ]
    : [];

export const getIndicesViaResolve = async ({
  http,
  pattern,
  showAllIndices,
  isRollupIndex,
  projectRouting,
}: {
  http: HttpStart;
  pattern: string;
  showAllIndices: boolean;
  isRollupIndex: (indexName: string) => boolean;
  projectRouting?: string;
}) => {
  const encodedPattern = encodeURIComponent(pattern);
  const query: Record<string, string> = {};
  if (showAllIndices) {
    query.expand_wildcards = 'all';
  }
  if (projectRouting) {
    query.project_routing = projectRouting;
  }
  return http
    .get<ResolveIndexResponse>(
      `/internal/index-pattern-management/resolve_index/${encodedPattern}`,
      {
        query: Object.keys(query).length > 0 ? query : undefined,
      }
    )
    .then((response) => {
      if (!response) {
        return [];
      } else {
        return responseToItemArray(response, getIndexTags(isRollupIndex));
      }
    });
};

export async function getIndices({
  http,
  pattern: rawPattern = '',
  showAllIndices = false,
  isRollupIndex,
  projectRouting,
}: {
  http: HttpStart;
  pattern: string;
  showAllIndices?: boolean;
  isRollupIndex: (indexName: string) => boolean;
  projectRouting?: string;
}): Promise<MatchedItem[]> {
  const pattern = rawPattern.trim();

  // Searching for `*:` fails for CCS environments. The search request
  // is worthless anyways as the we should only send a request
  // for a specific query (where we do not append *) if there is at
  // least a single character being searched for.
  if (pattern === '*:') {
    return [];
  }

  // This should never match anything so do not bother
  if (pattern === '') {
    return [];
  }

  // ES does not like just a `,*` and will throw a `[string_index_out_of_bounds_exception] String index out of range: 0`
  if (pattern.startsWith(',')) {
    return [];
  }

  return getIndicesViaResolve({
    http,
    pattern,
    showAllIndices,
    isRollupIndex,
    projectRouting,
  }).catch(() => []);
}

export const responseToItemArray = (
  response: ResolveIndexResponse,
  getTags: (indexName: string) => Tag[]
): MatchedItem[] => {
  const source: MatchedItem[] = [];

  (response.indices || []).forEach((index) => {
    const tags: MatchedItem['tags'] = [{ key: INDEX_TAG_KEY, name: indexLabel, color: 'default' }];
    const isFrozen = (index.attributes || []).includes(ResolveIndexResponseItemIndexAttrs.FROZEN);

    tags.push(...getTags(index.name));
    index.aliases?.forEach((alias) => {
      tags.push(...getTags(alias));
    });
    if (isFrozen) {
      tags.push({ name: frozenLabel, key: FROZEN_TAG_KEY, color: 'danger' });
    }

    source.push({
      name: index.name,
      tags,
      item: index,
    });
  });
  (response.aliases || []).forEach((alias) => {
    const tags: MatchedItem['tags'] = [{ key: ALIAS_TAG_KEY, name: aliasLabel, color: 'default' }];
    // we only need to check the first index to see if its a rollup since there can only be one alias match
    tags.push(...getTags(alias.indices[0]));
    tags.push(...getTags(alias.name));
    source.push({
      name: alias.name,
      tags,
      item: alias,
    });
  });
  (response.data_streams || []).forEach((dataStream) => {
    source.push({
      name: dataStream.name,
      tags: [{ key: DATA_STREAM_TAG_KEY, name: dataStreamLabel, color: 'primary' }],
      item: dataStream,
    });
  });

  return sortBy(source, 'name');
};
