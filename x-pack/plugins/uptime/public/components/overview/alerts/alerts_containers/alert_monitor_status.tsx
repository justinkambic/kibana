/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataPublicPluginSetup } from 'src/plugins/data/public';
import { selectMonitorStatusAlert, filterGroupDataSelector } from '../../../../state/selectors';
import { AlertMonitorStatusComponent } from '../index';
import { setEsKueryString } from '../../../../state/actions';

interface Props {
  autocomplete: DataPublicPluginSetup['autocomplete'];
  enabled: boolean;
  numTimes: number;
  setAlertParams: (key: string, value: any) => void;
  timerange: {
    from: string;
    to: string;
  };
}

export const AlertMonitorStatus = (props: Props) => {
  const { filters, locations } = useSelector(selectMonitorStatusAlert);
  const { esKuery } = useSelector(filterGroupDataSelector);

  return (
    <AlertMonitorStatusComponent
      esKuery={esKuery}
      filters={filters}
      locations={locations}
      {...props}
    />
  );
};
