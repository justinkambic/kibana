/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getAlertsGroupingQuery } from '.';

describe('getAlertsGroupingQuery', () => {
  it('returns query with aggregations for kibana.alert.rule.name', () => {
    const groupingQuery = getAlertsGroupingQuery({
      from: '2022-12-29T22:57:34.029Z',
      to: '2023-01-28T22:57:29.029Z',
      pageIndex: 0,
      pageSize: 25,
      runtimeMappings: {},
      selectedGroupEsTypes: ['keyword'],
      selectedGroup: 'kibana.alert.rule.name',
      additionalFilters: [
        {
          bool: {
            must: [],
            filter: [
              {
                match_phrase: {
                  'kibana.alert.workflow_status': 'acknowledged',
                },
              },
            ],
            should: [],
            must_not: [
              {
                exists: {
                  field: 'kibana.alert.building_block_type',
                },
              },
            ],
          },
        },
      ],
    });

    expect(groupingQuery).toStrictEqual({
      _source: false,
      aggs: {
        unitsCount: {
          value_count: {
            field: 'kibana.alert.rule.name',
          },
        },
        groupsCount: {
          cardinality: {
            field: 'kibana.alert.rule.name',
          },
        },
        groupByFields: {
          aggs: {
            unitsCount: {
              cardinality: {
                field: 'kibana.alert.uuid',
              },
            },
            description: {
              terms: {
                field: 'kibana.alert.rule.description',
                size: 1,
              },
            },
            bucket_truncate: {
              bucket_sort: {
                from: 0,
                size: 25,
                sort: [
                  {
                    unitsCount: {
                      order: 'desc',
                    },
                  },
                ],
              },
            },
            countSeveritySubAggregation: {
              cardinality: {
                field: 'kibana.alert.severity',
              },
            },
            hostsCountAggregation: {
              cardinality: {
                field: 'host.name',
              },
            },
            ruleTags: {
              terms: {
                field: 'kibana.alert.rule.tags',
              },
            },
            severitiesSubAggregation: {
              terms: {
                field: 'kibana.alert.severity',
              },
            },
            usersCountAggregation: {
              cardinality: {
                field: 'user.name',
              },
            },
          },
          multi_terms: {
            size: 10000,
            terms: [
              {
                field: 'kibana.alert.rule.name',
                missing: '-',
              },
              {
                field: 'kibana.alert.rule.name',
                missing: '--',
              },
            ],
          },
        },
      },
      query: {
        bool: {
          filter: [
            {
              bool: {
                filter: [
                  {
                    match_phrase: {
                      'kibana.alert.workflow_status': 'acknowledged',
                    },
                  },
                ],
                must: [],
                must_not: [
                  {
                    exists: {
                      field: 'kibana.alert.building_block_type',
                    },
                  },
                ],
                should: [],
              },
            },
            {
              range: {
                '@timestamp': {
                  gte: '2022-12-29T22:57:34.029Z',
                  lte: '2023-01-28T22:57:29.029Z',
                },
              },
            },
          ],
        },
      },
      runtime_mappings: {},
      size: 0,
    });
  });

  it('returns default query with aggregations if the field specific metrics was not defined', () => {
    const groupingQuery = getAlertsGroupingQuery({
      from: '2022-12-29T22:57:34.029Z',
      to: '2023-01-28T22:57:29.029Z',
      pageIndex: 0,
      pageSize: 25,
      runtimeMappings: {},
      selectedGroupEsTypes: ['keyword'],
      selectedGroup: 'process.name',
      additionalFilters: [
        {
          bool: {
            must: [],
            filter: [
              {
                match_phrase: {
                  'kibana.alert.workflow_status': 'acknowledged',
                },
              },
            ],
            should: [],
            must_not: [
              {
                exists: {
                  field: 'kibana.alert.building_block_type',
                },
              },
            ],
          },
        },
      ],
    });

    expect(groupingQuery).toStrictEqual({
      _source: false,
      aggs: {
        unitsCount: {
          value_count: {
            field: 'process.name',
          },
        },
        groupsCount: {
          cardinality: {
            field: 'process.name',
          },
        },
        groupByFields: {
          aggs: {
            unitsCount: {
              cardinality: {
                field: 'kibana.alert.uuid',
              },
            },
            bucket_truncate: {
              bucket_sort: {
                from: 0,
                size: 25,
                sort: [
                  {
                    unitsCount: {
                      order: 'desc',
                    },
                  },
                ],
              },
            },
            rulesCountAggregation: {
              cardinality: {
                field: 'kibana.alert.rule.rule_id',
              },
            },
          },
          multi_terms: {
            size: 10000,
            terms: [
              {
                field: 'process.name',
                missing: '-',
              },
              {
                field: 'process.name',
                missing: '--',
              },
            ],
          },
        },
      },
      query: {
        bool: {
          filter: [
            {
              bool: {
                filter: [
                  {
                    match_phrase: {
                      'kibana.alert.workflow_status': 'acknowledged',
                    },
                  },
                ],
                must: [],
                must_not: [
                  {
                    exists: {
                      field: 'kibana.alert.building_block_type',
                    },
                  },
                ],
                should: [],
              },
            },
            {
              range: {
                '@timestamp': {
                  gte: '2022-12-29T22:57:34.029Z',
                  lte: '2023-01-28T22:57:29.029Z',
                },
              },
            },
          ],
        },
      },
      runtime_mappings: {},
      size: 0,
    });
  });
});
