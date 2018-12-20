/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */



import _ from 'lodash';

import { INTERVALS } from './intervals';
import { singleSeriesCheckerFactory } from './single_series_checker';
import { polledDataCheckerFactory } from './polled_data_checker';

import { callWithInternalUserFactory } from '../../client/call_with_internal_user_factory';
import { isSecurityDisabled } from '../../lib/security_utils';
import { isBasicLicense } from '../../lib/check_license';

export function estimateBucketSpanFactory(callWithRequest, server) {
  const callWithInternalUser = callWithInternalUserFactory(server);
  const PolledDataChecker = polledDataCheckerFactory(callWithRequest);
  const SingleSeriesChecker = singleSeriesCheckerFactory(callWithRequest);

  class BucketSpanEstimator {
    constructor({ index, timeField, aggTypes, fields, duration, query, splitField }, splitFieldValues, maxBuckets) {
      this.index = index;
      this.timeField = timeField;
      this.aggTypes = aggTypes;
      this.fields = fields;
      this.duration = duration;
      this.query = query;
      this.splitField = splitField;
      this.splitFieldValues = splitFieldValues;
      this.checkers = [];

      this.thresholds = {
        minimumBucketSpanMS: 0
      };

      // In 6.2 upwards `search.max_buckets` is disabled by default (-1) but requests that try to
      // return more than 10,000 buckets (the default value for future versions) will log a deprecation warning.
      // If it's disabled we fall back to 10000 to avoid triggering the deprecation warning here.
      const MAX_BUCKETS_FALLBACK = 10000;
      maxBuckets = (maxBuckets === -1) ? MAX_BUCKETS_FALLBACK : maxBuckets;

      // determine durations for bucket span estimation
      // taking into account the clusters' search.max_buckets settings
      // the polled_data_checker uses an aggregation interval of 1 minute
      // so that's the smallest interval we have to check for not to
      // exceed search.max_buckets.
      const ONE_MINUTE_MS = 60000;
      const ONE_HOUR_MS = 3600000;
      // only run the tests over the last 250 hours of data at max
      const HOUR_MULTIPLIER = Math.min(250, Math.floor((maxBuckets * ONE_MINUTE_MS) / ONE_HOUR_MS));
      const timePickerDurationLength = (this.duration.end - this.duration.start);
      const multiplierDurationLength = (ONE_HOUR_MS * HOUR_MULTIPLIER);

      if (timePickerDurationLength > multiplierDurationLength) {
        // move time range to the end of the data
        this.duration.start = this.duration.end - multiplierDurationLength;
      }

      this.query.bool.must.push({
        range: {
          [this.timeField]: {
            gte: this.duration.start,
            lte: this.duration.end,
            format: 'epoch_millis'
          }
        }
      });

      this.polledDataChecker = new PolledDataChecker(
        this.index,
        this.timeField,
        this.duration,
        this.query);

      if(this.aggTypes.length === this.fields.length) {
        // loop over detectors
        for(let i = 0; i < this.aggTypes.length; i++) {
          if (this.splitField === undefined) {
            // either a single metric job or no data split
            this.checkers.push({
              check: new SingleSeriesChecker(
                this.index,
                this.timeField,
                this.aggTypes[i],
                this.fields[i],
                this.duration,
                this.query,
                this.thresholds),
              result: null
            });
          } else {
            // loop over partition values
            for(let j = 0; j < this.splitFieldValues.length; j++) {
              const queryCopy = _.cloneDeep(this.query);
              // add a term to the query to filter on the partition value
              queryCopy.bool.must.push({
                term: {
                  [this.splitField]: this.splitFieldValues[j]
                }
              });
              this.checkers.push({
                check: new SingleSeriesChecker(
                  this.index,
                  this.timeField,
                  this.aggTypes[i],
                  this.fields[i],
                  this.duration,
                  queryCopy,
                  this.thresholds),
                result: null
              });
            }
          }
        }
      }
    }

    run() {
      return new Promise((resolve, reject) => {
        if (this.checkers.length === 0) {
          console.log('BucketSpanEstimator: run has stopped because no checks where created');
          reject('BucketSpanEstimator: run has stopped because no checks where created');
        }

        this.polledDataChecker.run()
          .then((result) => {
          // if the data is polled, set a minimum threshold
          // of bucket span
            if (result.isPolled) {
              this.thresholds.minimumBucketSpanMS = result.minimumBucketSpan;
            }
            let checkCounter = this.checkers.length;
            const runComplete = () => {
              checkCounter--;

              if (checkCounter === 0) {
                const median = this.processResults();
                if (median !== null) {
                  resolve(median);
                } else {
                // no results found
                  console.log('BucketSpanEstimator: run has stopped because no checks returned a valid interval');
                  reject('BucketSpanEstimator: run has stopped because no checks returned a valid interval');
                }
              }
            };

            _.each(this.checkers, (check) => {
              check.check.run()
                .then((interval) => {
                  check.result = interval;
                  runComplete();
                })
                .catch(() => {
                  // run failed. this may be due to a lack of data
                  // mark the result as null so it can be filtered out
                  // later by processResults()
                  check.result = null;
                  runComplete();
                });
            });
          })
          .catch((resp) => {
            reject(resp);
          });
      });
    }

    processResults() {
      const allResults = _.map(this.checkers, 'result');

      let reducedResults = [];
      const numberOfSplitFields = this.splitFieldValues.length || 1;
      // find the median results per detector
      // if the data has been split, the may be ten results per detector,
      // so we need to find the median of those first.
      for(let i = 0; i < this.aggTypes.length; i++) {
        const pos = (i * numberOfSplitFields);
        let resultsSubset = allResults.slice(pos, pos + numberOfSplitFields);
        // remove results of tests which have failed
        resultsSubset = _.remove(resultsSubset, res => res !== null);
        resultsSubset = _.sortBy(resultsSubset, r => r.ms);

        const tempMedian = this.findMedian(resultsSubset);
        if (tempMedian !== null) {
          reducedResults.push(tempMedian);
        }
      }

      reducedResults = _.sortBy(reducedResults, r => r.ms);

      return this.findMedian(reducedResults);
    }

    findMedian(results) {
      let median = null;

      if (results.length) {
        if (results.length % 2 === 0) {
          // even number of results
          const medIndex = (((results.length) / 2) - 1);
          // find the two middle values
          const med1 = results[medIndex];
          const med2 = results[medIndex + 1];

          if (med1 === med2) {
            // if they're the same, use them
            median = med1;
          } else {
            let interval = null;
            // find the average ms value between the two middle intervals
            const avgMs = ((med2.ms - med1.ms) / 2) + med1.ms;
            // loop over the allowed bucket spans to find closest one
            for(let i = 1; i < INTERVALS.length; i++) {
              if(avgMs < INTERVALS[i].ms) {
                // see if it's closer to this interval or the one before
                const int1 = INTERVALS[i - 1];
                const int2 = INTERVALS[i];
                const diff = int2.ms - int1.ms;
                const d = avgMs - int1.ms;
                interval = ((d / diff) < 0.5) ? int1 : int2;
                break;
              }
            }
            median = interval;
          }
        } else {
          // odd number of results, take the middle one
          median = results[(results.length - 1) / 2];
        }
      }
      return median;
    }
  }

  const getFieldCardinality = function (index, field) {
    return new Promise((resolve, reject) => {
      callWithRequest('search', {
        index,
        size: 0,
        body: {
          aggs: {
            field_count: {
              cardinality: {
                field,
              }
            }
          }
        }
      })
        .then((resp) => {
          const value = _.get(resp, ['aggregations', 'field_count', 'value'], 0);
          resolve(value);
        })
        .catch((resp) => {
          reject(resp);
        });
    });
  };

  const getRandomFieldValues = function (index, field, query) {
    let fieldValues = [];
    return new Promise((resolve, reject) => {
      const NUM_PARTITIONS = 10;
      // use a partitioned search to load 10 random fields
      // load ten fields, to test that there are at least 10.
      getFieldCardinality(index, field)
        .then((value) => {
          const numPartitions = (Math.floor(value / NUM_PARTITIONS)) || 1;
          callWithRequest('search', {
            index,
            size: 0,
            body: {
              query,
              aggs: {
                fields_bucket_counts: {
                  terms: {
                    field,
                    include: {
                      partition: 0,
                      num_partitions: numPartitions
                    }
                  }
                }
              }
            }
          })
            .then((partitionResp) => {
              if (_.has(partitionResp, 'aggregations.fields_bucket_counts.buckets')) {
                const buckets = partitionResp.aggregations.fields_bucket_counts.buckets;
                fieldValues = _.map(buckets, b => b.key);
              }
              resolve(fieldValues);
            })
            .catch((resp) => {
              reject(resp);
            });
        })
        .catch((resp) => {
          reject(resp);
        });
    });
  };

  return function (formConfig) {
    if (typeof formConfig !== 'object' || formConfig === null) {
      throw new Error('Invalid formConfig: formConfig needs to be an object.');
    }

    if (typeof formConfig.index !== 'string') {
      throw new Error('Invalid formConfig: formConfig.index needs to be a string.');
    }

    if (typeof formConfig.duration !== 'object') {
      throw new Error('Invalid formConfig: formConfig.duration needs to be an object.');
    }

    if (typeof formConfig.fields === 'undefined') {
      throw new Error('Invalid formConfig: Missing fields.');
    }

    if (typeof formConfig.filters === 'undefined') {
      throw new Error('Invalid formConfig: Missing filters.');
    }

    if (typeof formConfig.query === 'undefined') {
      throw new Error('Invalid formConfig: Missing query.');
    }

    return new Promise((resolve, reject) => {
      function getBucketSpanEstimation() {
        // fetch the `search.max_buckets` cluster setting so we're able to
        // adjust aggregations to not exceed that limit.
        callWithInternalUser('cluster.getSettings', {
          flatSettings: true,
          includeDefaults: true,
          filterPath: '*.*max_buckets'
        })
          .then((settings) => {
            if (typeof settings !== 'object' || typeof settings.defaults !== 'object') {
              reject('Unable to retrieve cluster setting search.max_buckets');
            }

            const maxBuckets = parseInt(settings.defaults['search.max_buckets']);

            const runEstimator = (splitFieldValues = []) => {
              const bucketSpanEstimator = new BucketSpanEstimator(
                formConfig,
                splitFieldValues,
                maxBuckets
              );

              bucketSpanEstimator.run()
                .then((resp) => {
                  resolve(resp);
                })
                .catch((resp) => {
                  reject(resp);
                });
            };

            // a partition has been selected, so we need to load some field values to use in the
            // bucket span tests.
            if (formConfig.splitField !== undefined) {
              getRandomFieldValues(formConfig.index, formConfig.splitField, formConfig.query)
                .then((splitFieldValues) => {
                  runEstimator(splitFieldValues);
                })
                .catch((resp) => {
                  reject(resp);
                });
            } else {
              // no partition field selected or we're in the single metric config
              runEstimator();
            }
          })
          .catch((resp) => {
            reject(resp);
          });
      }

      if (isBasicLicense(server) || isSecurityDisabled(server)) {
        getBucketSpanEstimation();
      } else {
        // if security is enabled, check that the user has permission to
        // view jobs before calling getBucketSpanEstimation.
        // getBucketSpanEstimation calls the 'cluster.getSettings' endpoint as the internal user
        // and so could give the user access to more information than
        // they are entitled to.
        const body = {
          cluster: [
            'cluster:monitor/xpack/ml/job/get',
            'cluster:monitor/xpack/ml/job/stats/get',
            'cluster:monitor/xpack/ml/datafeeds/get',
            'cluster:monitor/xpack/ml/datafeeds/stats/get'
          ]
        };
        callWithRequest('ml.privilegeCheck', { body })
          .then((resp) => {
            if (resp.cluster['cluster:monitor/xpack/ml/job/get'] &&
              resp.cluster['cluster:monitor/xpack/ml/job/stats/get'] &&
              resp.cluster['cluster:monitor/xpack/ml/datafeeds/get'] &&
              resp.cluster['cluster:monitor/xpack/ml/datafeeds/stats/get']) {
              getBucketSpanEstimation();
            } else {
              reject('Insufficient permissions to call bucket span estimation.');
            }
          })
          .catch(reject);
      }


    });
  };
}
