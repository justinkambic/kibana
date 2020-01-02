/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { HttpHandler } from 'kibana/public';
import { IndexStatus } from '../../../common/runtime_types';

export const FETCH_INDEX_STATUS = 'FETCH_INDEX_STATUS';
export const FETCH_INDEX_STATUS_SUCCESS = 'FETCH_INDEX_STATUS_SUCCESS';
export const FETCH_INDEX_STATUS_FAIL = 'FETCH_INDEX_STATUS_FAIL';

export interface GetIndexStatusPayload {
  fetch: HttpHandler;
}

interface GetIndexStatusAction {
  type: typeof FETCH_INDEX_STATUS;
  payload: GetIndexStatusPayload;
}

interface GetIndexStatusSuccessAction {
  type: typeof FETCH_INDEX_STATUS_SUCCESS;
  payload: IndexStatus;
}

interface GetIndexStatusFailAction {
  type: typeof FETCH_INDEX_STATUS_FAIL;
  payload: {
    error: Error;
  };
}

export function fetchIndexStatus(fetch: HttpHandler): GetIndexStatusAction {
  return {
    type: FETCH_INDEX_STATUS,
    payload: {
      fetch,
    },
  };
}

export function fetchIndexStatusSuccess(indexStatus: IndexStatus): GetIndexStatusSuccessAction {
  return {
    type: FETCH_INDEX_STATUS_SUCCESS,
    payload: indexStatus,
  };
}

export function fetchIndexStatusFail(error: Error): GetIndexStatusFailAction {
  return {
    type: FETCH_INDEX_STATUS_FAIL,
    payload: {
      error,
    },
  };
}

export type IndexStatusTypes =
  | GetIndexStatusAction
  | GetIndexStatusSuccessAction
  | GetIndexStatusFailAction;
