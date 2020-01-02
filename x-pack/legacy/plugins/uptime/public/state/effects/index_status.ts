/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { call, put, takeLatest } from 'redux-saga/effects';
import { Action } from 'redux-actions';
import {
  GetIndexStatusPayload,
  fetchIndexStatusFail,
  fetchIndexStatusSuccess,
  FETCH_INDEX_STATUS,
} from '../actions';
import { fetchIndexStatus } from '../api';

function* indexStatusSaga(action: Action<GetIndexStatusPayload>) {
  try {
    if (!action.payload) {
      yield put(
        fetchIndexStatusFail(new Error('Cannot fetch index status for undefined parameters'))
      );
      return;
    }
    const {
      payload: { fetch },
    } = action;
    const response = yield call(fetchIndexStatus, {
      fetch,
    });
    yield put(fetchIndexStatusSuccess(response));
  } catch (error) {
    yield put(fetchIndexStatusFail(error));
  }
}

export function* fetchIndexStatusSaga() {
  yield takeLatest(FETCH_INDEX_STATUS, indexStatusSaga);
}
