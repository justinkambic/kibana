/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * Tag keys emitted by `responseToItemArray` (and therefore by `getIndices`)
 * for entries returned by the `_resolve/index` API.
 *
 * Consumers comparing against `MatchedItem['tags'][number].key` should import
 * these constants instead of hardcoding the string literals, so that a rename
 * here surfaces as a TypeScript error at every call site rather than as a
 * silent misclassification at runtime.
 *
 * The rollup tag key is already exposed via `INDEX_PATTERN_TYPE.ROLLUP`.
 */

/** @public */
export const INDEX_TAG_KEY = 'index' as const;

/** @public */
export const ALIAS_TAG_KEY = 'alias' as const;

/** @public */
export const DATA_STREAM_TAG_KEY = 'data_stream' as const;

/** @public */
export const FROZEN_TAG_KEY = 'frozen' as const;
