/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { get, set } from 'lodash';
import { ElasticsearchMonitorsAdapter } from '../elasticsearch_monitors_adapter';
import { CountParams, CountResponse } from 'elasticsearch';
import mockChartsData from './monitor_charts_mock.json';

const assertCloseTo = (actual: number, expected: number, precision: number) => {
  if (Math.abs(expected - actual) > precision) {
    throw new Error(`expected [${actual}] to be within ${precision} of ${actual}`);
  }
};
import filterResult from './filter_result.json';

// FIXME: there are many untested functions in this adapter. They should be tested.
describe('ElasticsearchMonitorsAdapter', () => {
  let defaultCountResponse: CountResponse;

  beforeEach(() => {
    defaultCountResponse = {
      count: 0,
      _shards: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
      },
    };
  });

  it('will return filter data for each expected field', async () => {
    const searchMock = jest.fn();
    searchMock.mockReturnValue({ aggregations: filterResult });
    const database = {
      search: searchMock,
      count: jest.fn(),
      head: jest.fn(),
    };
    const adapter = new ElasticsearchMonitorsAdapter(database);
    const filters = await adapter.getFilterBar({}, 'now-3w', 'now-2h');
    expect(searchMock).toHaveBeenCalled();
    expect(filters).toMatchSnapshot();
  });

  it('getMonitorChartsData will run expected parameters when no location is specified', async () => {
    expect.assertions(3);
    const searchMock = jest.fn();
    const search = searchMock.bind({});
    const database = {
      search,
      count: async (request: any, params: CountParams) => defaultCountResponse,
      head: async (request: any, params: any) => null,
    };
    const adapter = new ElasticsearchMonitorsAdapter(database);
    await adapter.getMonitorChartsData({}, 'fooID', 'now-15m', 'now');
    expect(searchMock).toHaveBeenCalledTimes(1);
    // protect against possible rounding errors polluting the snapshot comparison
    const fixedInterval = parseInt(
      get(
        searchMock.mock.calls[0][1],
        'body.aggs.timeseries.date_histogram.fixed_interval',
        ''
      ).split('ms')[0],
      10
    );
    expect(fixedInterval).not.toBeNaN();

    /**
     * The value based on the input should be ~36000
     */
    assertCloseTo(fixedInterval, 36000, 100);

    set(
      searchMock.mock.calls[0][1],
      'body.aggs.timeseries.date_histogram.fixed_interval',
      '36000ms'
    );
    expect(searchMock.mock.calls[0]).toMatchSnapshot();
  });

  it('getMonitorChartsData will provide expected filters when a location is specified', async () => {
    expect.assertions(3);
    const searchMock = jest.fn();
    const search = searchMock.bind({});
    const database = {
      search,
      count: async (request: any, params: CountParams) => defaultCountResponse,
      head: async (request: any, params: any) => null,
    };
    const adapter = new ElasticsearchMonitorsAdapter(database);
    await adapter.getMonitorChartsData({}, 'fooID', 'now-15m', 'now', 'Philadelphia');
    expect(searchMock).toHaveBeenCalledTimes(1);
    // protect against possible rounding errors polluting the snapshot comparison
    const fixedInterval = parseInt(
      get(
        searchMock.mock.calls[0][1],
        'body.aggs.timeseries.date_histogram.fixed_interval',
        ''
      ).split('ms')[0],
      10
    );
    expect(fixedInterval).not.toBeNaN();

    /**
     * The value based on the input should be ~36000
     */
    assertCloseTo(fixedInterval, 36000, 100);

    set(
      searchMock.mock.calls[0][1],
      'body.aggs.timeseries.date_histogram.fixed_interval',
      '36000ms'
    );
    expect(searchMock.mock.calls[0]).toMatchSnapshot();
  });

  it('inserts empty buckets for missing data', async () => {
    const searchMock = jest.fn();
    searchMock.mockReturnValue(mockChartsData);
    const database = {
      search: searchMock,
      count: jest.fn(),
      head: jest.fn(),
    };
    const adapter = new ElasticsearchMonitorsAdapter(database);
    expect(await adapter.getMonitorChartsData({}, 'id', 'now-15m', 'now')).toMatchSnapshot();
  });
});
