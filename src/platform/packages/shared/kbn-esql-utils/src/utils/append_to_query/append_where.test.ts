/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  appendWhereClauseToESQLQuery,
  appendMultiDimensionFilterToESQLQuery,
  type DimensionFilter,
} from './append_where';

describe('appendWhereClauseToESQLQuery', () => {
  it('appends a filter in where clause in an existing query', () => {
    expect(
      appendWhereClauseToESQLQuery('from logstash-* // meow', 'dest', 'tada!', '+', 'string')
    ).toBe(
      `from logstash-* // meow
| WHERE \`dest\` == "tada!"`
    );
  });
  it('appends a filter out where clause in an existing query', () => {
    expect(
      appendWhereClauseToESQLQuery('from logstash-* // meow', 'dest', 'tada!', '-', 'string')
    ).toBe(
      `from logstash-* // meow
| WHERE \`dest\` != "tada!"`
    );
  });

  it('appends a where clause in an existing query with casting to string when the type is not string or number', () => {
    expect(
      appendWhereClauseToESQLQuery('from logstash-* // meow', 'ip_field', 'tada!', '-', 'ip')
    ).toBe(
      `from logstash-* // meow
| WHERE \`ip_field\` != "tada!"`
    );
  });

  it('appends a where clause in an existing query with casting to string when the type is not given', () => {
    expect(appendWhereClauseToESQLQuery('from logstash-* // meow', 'dest', 'tada!', '-')).toBe(
      `from logstash-* // meow
| WHERE \`dest\`::string != "tada!"`
    );
  });

  it('appends a where clause in an existing query checking that the value is not null if the user asks for existence', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* // meow',
        'dest',
        undefined,
        'is_not_null',
        'string'
      )
    ).toBe(
      `from logstash-* // meow
| WHERE \`dest\` is not null`
    );
  });

  it('appends a where clause in an existing query checking that the value is null if the user filters a null value', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* // meow',
        'dest',
        undefined,
        'is_null',
        'string'
      )
    ).toBe(
      `from logstash-* // meow
| WHERE \`dest\` is null`
    );
  });

  it('appends an and clause in an existing query with where command as the last pipe', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | where country == "GR"',
        'dest',
        'Crete',
        '+',
        'string'
      )
    ).toBe(
      `from logstash-* | where country == "GR"
AND \`dest\` == "Crete"`
    );
  });

  it('doesnt append anything in an existing query with where command as the last pipe if the filter preexists', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | where country == "GR"',
        'country',
        'GR',
        '+',
        'string'
      )
    ).toBe(`from logstash-* | where country == "GR"`);
  });

  it('doesnt append anything in an existing query with where command as the last pipe if the _exists_ filter preexists', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | where country IS NOT NULL',
        'country',
        undefined,
        'is_not_null',
        'string'
      )
    ).toBe(`from logstash-* | where country IS NOT NULL`);
  });

  it('changes the operator in an existing query with where command as the last pipe if the filter preexists but has the opposite operator', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | where country == "GR"',
        'country',
        'GR',
        '-',
        'string'
      )
    ).toBe(`from logstash-* | where country != "GR"`);
  });

  it('changes the operator in an existing query with where command as the last pipe if the filter preexists but has the opposite operator, the field has backticks', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | where `country` == "GR"',
        'country',
        'GR',
        '-',
        'string'
      )
    ).toBe(`from logstash-* | where \`country\`!= "GR"`);
  });

  it('appends an and clause in an existing query with where command as the last pipe if the filter preexists but the operator is not the correct one', () => {
    expect(
      appendWhereClauseToESQLQuery(
        `from logstash-* | where CIDR_MATCH(ip1, "127.0.0.2/32", "127.0.0.3/32")`,
        'ip',
        '127.0.0.2/32',
        '-',
        'ip'
      )
    ).toBe(
      `from logstash-* | where CIDR_MATCH(ip1, "127.0.0.2/32", "127.0.0.3/32")
AND \`ip\` != "127.0.0.2/32"`
    );
  });

  it('appends MATCH clauses for multivalue fields with + operation', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-*',
        'tags.keyword',
        ['info', 'success'],
        '+',
        'string'
      )
    ).toBe(
      `from logstash-*
| WHERE MATCH(\`tags.keyword\`, "info") AND MATCH(\`tags.keyword\`, "success")`
    );
  });

  it('appends NOT MATCH clauses for multivalue fields with - operation', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-*',
        'tags.keyword',
        ['info', 'success'],
        '-',
        'string'
      )
    ).toBe(
      `from logstash-*
| WHERE NOT MATCH(\`tags.keyword\`, "info") AND NOT MATCH(\`tags.keyword\`, "success")`
    );
  });

  it('appends AND MATCH clauses for multivalue fields when WHERE clause already exists', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | WHERE country == "GR"',
        'tags.keyword',
        ['info', 'success'],
        '+',
        'string'
      )
    ).toBe(
      `from logstash-* | WHERE country == "GR"
AND MATCH(\`tags.keyword\`, "info") AND MATCH(\`tags.keyword\`, "success")`
    );
  });

  it('does not append MATCH clauses for multivalue fields when WHERE clause already exists with the same filters', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | WHERE MATCH(`tags.keyword`, "info") AND MATCH(`tags.keyword`, "success")',
        'tags.keyword',
        ['info', 'success'],
        '+',
        'string'
      )
    ).toBe(
      `from logstash-* | WHERE MATCH(\`tags.keyword\`, "info") AND MATCH(\`tags.keyword\`, "success")`
    );
  });

  it('negates the MATCH clauses for multivalue fields when WHERE clause already exists with the same filters', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-* | WHERE MATCH(`tags.keyword`, "info") AND MATCH(`tags.keyword`, "success")',
        'tags.keyword',
        ['info', 'success'],
        '-',
        'string'
      )
    ).toBe(
      `from logstash-* | WHERE NOT MATCH(\`tags.keyword\`, "info") AND NOT MATCH(\`tags.keyword\`, "success")`
    );
  });

  it('handles existence checks for multivalue fields with is_not_null', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-*',
        'tags.keyword',
        ['info', 'success'],
        'is_not_null',
        'string'
      )
    ).toBe(
      `from logstash-*
| WHERE \`tags.keyword\` is not null`
    );
  });

  it('handles existence checks for multivalue fields with is_null', () => {
    expect(
      appendWhereClauseToESQLQuery(
        'from logstash-*',
        'tags.keyword',
        ['info', 'success'],
        'is_null',
        'string'
      )
    ).toBe(
      `from logstash-*
| WHERE \`tags.keyword\` is null`
    );
  });
});

describe('appendMultiDimensionFilterToESQLQuery', () => {
  describe('single dimension (no parentheses)', () => {
    it('appends a single dimension filter without WHERE clause', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE \`host.name\` == "server-1"`
      );
    });

    it('appends a single dimension filter with WHERE clause (appends AND)', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(
        appendMultiDimensionFilterToESQLQuery(
          'FROM metrics-* | WHERE env == "prod"',
          dimensionFilters,
          '+'
        )
      ).toBe(
        `FROM metrics-* | WHERE env == "prod"
AND \`host.name\` == "server-1"`
      );
    });

    it('handles single dimension with != operation', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '-')).toBe(
        `FROM metrics-*
| WHERE \`host.name\` != "server-1"`
      );
    });
  });

  describe('multiple dimensions (with parentheses)', () => {
    it('appends multiple dimension filters without WHERE clause', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
        { field: 'region', value: 'us-east', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE (\`host.name\` == "server-1" AND \`region\` == "us-east")`
      );
    });

    it('appends multiple dimension filters with WHERE clause (appends AND)', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
        { field: 'region', value: 'us-east', fieldType: 'string' },
      ];
      expect(
        appendMultiDimensionFilterToESQLQuery(
          'FROM metrics-* | WHERE env == "prod"',
          dimensionFilters,
          '+'
        )
      ).toBe(
        `FROM metrics-* | WHERE env == "prod"
AND (\`host.name\` == "server-1" AND \`region\` == "us-east")`
      );
    });

    it('handles three dimensions', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
        { field: 'region', value: 'us-east', fieldType: 'string' },
        { field: 'zone', value: 'zone-a', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE (\`host.name\` == "server-1" AND \`region\` == "us-east" AND \`zone\` == "zone-a")`
      );
    });

    it('handles multiple dimensions with != operation', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
        { field: 'region', value: 'us-east', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '-')).toBe(
        `FROM metrics-*
| WHERE (\`host.name\` != "server-1" AND \`region\` != "us-east")`
      );
    });
  });

  describe('field type handling', () => {
    it('handles different field types correctly', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
        { field: 'host.ip', value: '192.168.1.1', fieldType: 'ip' },
        { field: 'cpu.cores', value: 8, fieldType: 'number' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE (\`host.name\` == "server-1" AND \`host.ip\` == "192.168.1.1" AND \`cpu.cores\` == 8)`
      );
    });

    it('applies string casting when fieldType is not provided', () => {
      const dimensionFilters: DimensionFilter[] = [{ field: 'host.name', value: 'server-1' }];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE \`host.name\`::string == "server-1"`
      );
    });
  });

  describe('edge cases', () => {
    it('returns original query when dimensionFilters is empty', () => {
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', [], '+')).toBe(
        'FROM metrics-*'
      );
    });

    it('handles query with comments', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(
        appendMultiDimensionFilterToESQLQuery('FROM metrics-* // comment', dimensionFilters, '+')
      ).toBe(
        `FROM metrics-* // comment
| WHERE \`host.name\` == "server-1"`
      );
    });

    it('handles query ending with different command (not WHERE)', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(
        appendMultiDimensionFilterToESQLQuery(
          'FROM metrics-* | STATS count() BY host.name',
          dimensionFilters,
          '+'
        )
      ).toBe(
        `FROM metrics-* | STATS count() BY host.name
| WHERE \`host.name\` == "server-1"`
      );
    });

    it('handles special characters in values', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1 (production)', fieldType: 'string' },
        { field: 'region', value: 'us-east-1', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters, '+')).toBe(
        `FROM metrics-*
| WHERE (\`host.name\` == "server-1 (production)" AND \`region\` == "us-east-1")`
      );
    });
  });

  describe('default operation', () => {
    it('defaults to + operation when not specified', () => {
      const dimensionFilters: DimensionFilter[] = [
        { field: 'host.name', value: 'server-1', fieldType: 'string' },
      ];
      expect(appendMultiDimensionFilterToESQLQuery('FROM metrics-*', dimensionFilters)).toBe(
        `FROM metrics-*
| WHERE \`host.name\` == "server-1"`
      );
    });
  });
});
