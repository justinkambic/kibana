/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import { AppState } from '../../../state';
import { selectIndexPattern, filterGroupDataSelector } from '../../../state/selectors';
import { getIndexPattern, setEsKueryString } from '../../../state/actions';
import { KueryBarComponent } from './kuery_bar';

const mapStateToProps = (state: AppState) => ({
  ...selectIndexPattern(state),
  ...filterGroupDataSelector(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  loadIndexPattern: () => {
    dispatch(getIndexPattern({}));
  },
  updateEsKuery: (value: string) => {
    dispatch(setEsKueryString(value));
  },
});

export const KueryBar = connect(mapStateToProps, mapDispatchToProps)(KueryBarComponent);
