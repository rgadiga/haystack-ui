/*
 * Copyright 2017 Expedia, Inc.
 *
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *
 *             http://www.apache.org/licenses/LICENSE-2.0
 *
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */

const Q = require('q');
const _ = require('lodash');

const store = {};

function getValue(min, max) {
    return _.round((Math.random() * (max - min)) + min, 0);
}

function getTimeStamp(addMin) {
    const currentTime = ((new Date()).getTime());
    return (currentTime - (addMin * 60 * 1000));
}

function getRandomValues(timeWindow, dataPoints) {
    const valuesArr = [];
    _.range(dataPoints).forEach(i => valuesArr.push({value: getValue(1000, 10000000), timestamp: getTimeStamp(i * timeWindow)}));
    return valuesArr;
}

store.getServiceStats = (serviceName, granularity, from, until) => {
    const deffered = Q.defer();

    const range = until - from;
    const points = range / granularity;
    const mins = granularity / (60 * 1000);

    deffered.resolve([
        {
            type: 'Incoming Requests',
            count: 50000,
            successPercent: getValue(80, 100),
            tp99Duration: getRandomValues(mins, points)
        }]);

    return deffered.promise;
};

store.getServicePerfStats = () => {
    const deffered = Q.defer();

    deffered.resolve(
         [
             {serviceName: 'Service 1', successPercent: getValue(90, 100), failureCount: getValue(10, 100000), totalCount: getValue(1000000000, 10000000000)},
             {serviceName: 'Service 2', successPercent: getValue(90, 100), failureCount: getValue(10, 100000), totalCount: getValue(1000000, 10000000)},
             {serviceName: 'Service 3', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(1000000, 1000000)},
             {serviceName: 'Service 4', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100000)},
             {serviceName: 'Service 5', successPercent: null, failureCount: getValue(10, 100000), totalCount: getValue(10, 100000)},
             {serviceName: 'Service 6', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100000)},
             {serviceName: 'Service 7', successPercent: null, failureCount: getValue(10, 100000), totalCount: getValue(10, 100000)},
             {serviceName: 'Service 8', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 1000)},
             {serviceName: 'Service 9', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 1000)},
             {serviceName: 'Service 10', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 1000)},
             {serviceName: 'Service 11', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)},
             {serviceName: 'Service 12', successPercent: getValue(95, 100), failureCount: getValue(10, 100000), totalCount: getValue(1, 10)},
             {serviceName: 'Service 13', successPercent: getValue(90, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)},
             {serviceName: 'Service 14', successPercent: getValue(90, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 1000)},
             {serviceName: 'Service 15', successPercent: getValue(10, 40), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)},
             {serviceName: 'Service 16', successPercent: getValue(90, 100), failureCount: getValue(10, 100000), totalCount: getValue(1000000, 10000000)},
             {serviceName: 'Service 17', successPercent: getValue(99, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100000)},
             {serviceName: 'Service 18', successPercent: getValue(99, 100), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)},
             {serviceName: 'Service 19', successPercent: getValue(10, 40), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)},
             {serviceName: 'Service 20', successPercent: getValue(0, 1), failureCount: getValue(10, 100000), totalCount: getValue(10, 100)}
         ]
    );

    return deffered.promise;
};

store.getServiceTrends = (serviceName, granularity, from, until) => {
    const deffered = Q.defer();

    const range = until - from;
    const points = range / granularity;
    const mins = granularity / (60 * 1000);

    deffered.resolve({
        count: getRandomValues(mins, points),
        successCount: getRandomValues(mins, points),
        failureCount: getRandomValues(mins, points),
        meanDuration: getRandomValues(mins, points),
        tp95Duration: getRandomValues(mins, points),
        tp99Duration: getRandomValues(mins, points)
    });

    return deffered.promise;
};

store.getOperationStats = (serviceName, granularity, from, until) => {
    const deffered = Q.defer();

    const range = until - from;
    const points = range / granularity;
    const mins = granularity / (60 * 1000);

    deffered.resolve([
        {
            operationName: 'tarley-1',
            count: 18800,
            successPercent: getValue(80, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'snow-1',
            count: 15075,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'grayjoy-1',
            count: 299,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'tully-1',
            count: 58859,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'clegane-1',
            count: 18800,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'drogo-1',
            count: 15075,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'dondarrion-1',
            count: 5750,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        },
        {
            operationName: 'mormont-1',
            count: 5899,
            successPercent: getValue(90, 100),
            tp99Duration: getRandomValues(mins, points)
        }
    ]);

    return deffered.promise;
};

store.getOperationTrends = (serviceName, operationName, granularity, from, until) => {
    const deffered = Q.defer();

    const range = until - from;
    const points = range / granularity;
    const mins = granularity / (60 * 1000);

    deffered.resolve({
        count: getRandomValues(mins, points),
        successCount: getRandomValues(mins, points),
        failureCount: getRandomValues(mins, points),
        meanDuration: getRandomValues(mins, points),
        tp95Duration: getRandomValues(mins, points),
        tp99Duration: getRandomValues(mins, points)
    });

    return deffered.promise;
};

module.exports = store;
