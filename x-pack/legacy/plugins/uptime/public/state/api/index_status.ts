/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { HttpHandler } from 'kibana/public';
import { isRight } from 'fp-ts/lib/Either';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { IndexStatus, IndexStatusType } from '../../../common/runtime_types';

interface ApiRequest {
  fetch: HttpHandler;
}

export const fetchIndexStatus = async ({ fetch }: ApiRequest): Promise<IndexStatus> => {
  const response = await fetch('/api/uptime/docs/count');
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const responseData = await response.json();
  const decoded = IndexStatusType.decode(responseData);
  ThrowReporter.report(decoded);
  if (isRight(decoded)) {
    return decoded.right;
  }
  throw new Error('`getIndexStatus` response did not correspond to expected type');
};
