/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { CreateUMGraphQLResolvers, UMContext } from '../types';
import { UMServerLibs } from '../../lib/lib';
import {
  GetMonitorStatesQueryArgs,
  MonitorSummaryResult,
  StatesIndexStatus,
  UMResolver,
} from '../../../common';
import { CONTEXT_DEFAULTS } from '../../../common/constants/context_defaults';

export type UMGetMonitorStatesResolver = UMResolver<
  MonitorSummaryResult | Promise<MonitorSummaryResult>,
  any,
  GetMonitorStatesQueryArgs,
  UMContext
>;

export type UMStatesIndexExistsResolver = UMResolver<
  StatesIndexStatus | Promise<StatesIndexStatus>,
  any,
  {},
  UMContext
>;

export const createMonitorStatesResolvers: CreateUMGraphQLResolvers = (
  libs: UMServerLibs
): {
  Query: {
    getMonitorStates: UMGetMonitorStatesResolver;
    getStatesIndexStatus: UMStatesIndexExistsResolver;
  };
} => {
  return {
    Query: {
      async getMonitorStates(
        _resolver,
        { dateRangeStart, dateRangeEnd, filters, pagination, statusFilter },
        { APICaller }
      ): Promise<MonitorSummaryResult> {
        const decodedPagination = pagination
          ? JSON.parse(decodeURIComponent(pagination))
          : CONTEXT_DEFAULTS.CURSOR_PAGINATION;
        const [
          totalSummaryCount,
          { summaries, nextPagePagination, prevPagePagination },
        ] = await Promise.all([
          libs.pings.getDocCount({ callES: APICaller }),
          libs.monitorStates.getMonitorStates({
            callES: APICaller,
            dateRangeStart,
            dateRangeEnd,
            pagination: decodedPagination,
            filters,
            // this is added to make typescript happy,
            // this sort of reassignment used to be further downstream but I've moved it here
            // because this code is going to be decomissioned soon
            statusFilter: statusFilter || undefined,
          }),
        ]);
        return {
          summaries,
          nextPagePagination,
          prevPagePagination,
          totalSummaryCount,
        };
      },
      async getStatesIndexStatus(_resolver, {}, { APICaller }): Promise<StatesIndexStatus> {
        return await libs.monitorStates.statesIndexExists({ callES: APICaller });
      },
    },
  };
};
