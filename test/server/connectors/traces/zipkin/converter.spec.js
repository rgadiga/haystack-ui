/*
 * Copyright 2018 Expedia Group
 *
 *       Licensed under the Apache License, Version 2.0 (the License);
 *       you may not use this file except in compliance with the License.
 *       You may obtain a copy of the License at
 *
 *           http://www.apache.org/licenses/LICENSE-2.0
 *
 *       Unless required by applicable law or agreed to in writing, software
 *       distributed under the License is distributed on an AS IS BASIS,
 *       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *       See the License for the specific language governing permissions and
 *       limitations under the License.
 *
 */
import {expect, should} from 'chai';

const converter = require('../../../../../server/connectors/traces/zipkin/converter');

// endpoints from zipkin2.TestObjects
const frontend = {
  serviceName: 'frontend',
  ipv4: '127.0.0.1',
  port: 8080
};

const backend = {
  serviceName: 'backend',
  ipv4: '192.168.99.101',
  port: 9000
};

describe('converter.toHaystackTrace', () => {

  // haystack specific tests have nothing to do with zipkin conventions
  it('haystack specific: success true to error false', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      localEndpoint: frontend,
      tags: {
        'success': 'true'
      }
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'frontend',
      operationName: 'get',
      logs: [],
      tags: [
        { key: 'error', value: 'false' },
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  it('haystack specific: success false to error true', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      localEndpoint: frontend,
      tags: {
        'success': 'false'
      }
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'frontend',
      operationName: 'get',
      logs: [],
      tags: [
        { key: 'error', value: 'true' },
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // in zipkin, this would be http.url
  it('haystack specific: renamed methoduri to url', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      localEndpoint: frontend,
      tags: {
        'methoduri': 'http://foo.com/pants'
      }
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'frontend',
      operationName: 'get',
      logs: [],
      tags: [
        { key: 'url', value: 'http://foo.com/pants' },
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // in zipkin, name is optional
  it('haystack specific: missing names are not_found', () => {
    const v2 = {
      traceId: '1',
      id: '2',
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'not_found',
      operationName: 'not_found',
      logs: [],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.client
  it('converts client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [
        { value: 'ws', timestamp: 1472470996238000 },
        { value: 'wr', timestamp: 1472470996403000 }
      ],
      tags: {
        'http.path': '/api',
        'clnt/finagle.version': '6.45.0'
      }
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      operationName: 'get',
      serviceName: 'frontend',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'cs' }]},
        { timestamp: 1472470996238000, // ts order retained
          fields: [{ key: 'event', value: 'ws' }]},
        { timestamp: 1472470996403000,
          fields: [{ key: 'event', value: 'wr' }]},
        { timestamp: 1472470996406000,
          fields: [{ key: 'event', value: 'cr' }]}
      ],
      tags: [
        { key: 'http.path', value: '/api' },
        { key: 'clnt/finagle.version', value: '6.45.0' },
        { key: 'remote.service_name', value: 'backend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  it('should delete self-referencing parentId', () => {
    const converted = converter.toHaystackSpan({
      traceId: '1',
      parentId: '3', // self-referencing
      id: '3'
    });

    should().equal(converted.parentSpanId, undefined);
  });

  // originally zipkin2.v1.SpanConverterTest.SpanConverterTest.client_unfinished
  it('converts incomplete client span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      timestamp: 1472470996199000,
      localEndpoint: frontend,
      annotations: [
        { value: 'ws', timestamp: 1472470996238000 }
      ]
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'frontend',
      operationName: 'get',
      startTime: 1472470996199000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'cs' }]},
        { timestamp: 1472470996238000,
          fields: [{ key: 'event', value: 'ws' }]}
      ],
      tags: [] // prefers empty array to nil
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.client_kindInferredFromAnnotation
  it('infers cr log event', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      annotations: [
        { value: 'cs', timestamp: 1472470996199000 }
      ]
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'frontend',
      operationName: 'get',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'cs' }]},
        { timestamp: 1472470996406000,
          fields: [{ key: 'event', value: 'cr' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_cr
  it('converts client span reporting remote endpoint with late cr', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'CLIENT',
      localEndpoint: frontend,
      remoteEndpoint: backend,
      annotations: [
        { value: 'cr', timestamp: 1472470996199000 }
      ]
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'frontend',
      operationName: 'get',
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'cr' }]}
      ],
      tags: [
        { key: 'remote.service_name', value: 'backend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_sa
  it('converts late remoteEndpoint to remote.service_name', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      remoteEndpoint: backend
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'not_found',
      operationName: 'not_found',
      logs: [],
      tags: [
        { key: 'remote.service_name', value: 'backend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.noAnnotationsExceptAddresses
  it('converts when remoteEndpoint exist without kind', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      timestamp: 1472470996199000,
      duration: 207000,
      localEndpoint: frontend,
      remoteEndpoint: backend
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      operationName: 'get',
      serviceName: 'frontend',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [],
      tags: [
        { key: 'remote.service_name', value: 'backend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.server
  it('converts root server span', () => {
    // let's pretend there was no caller, so we don't set shared flag
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 207000,
      tags: {
        'http.path': '/api',
        'finagle.version': '6.45.0'
      }
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'backend',
      operationName: 'get',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'sr' }]},
        { timestamp: 1472470996406000,
          fields: [{ key: 'event', value: 'ss' }]}
      ],
      tags: [
        { key: 'http.path', value: '/api' },
        { key: 'finagle.version', value: '6.45.0' },
        { key: 'remote.service_name', value: 'frontend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.missingEndpoints
  it('converts span with no endpoints', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      duration: 207000
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'not_found',
      operationName: 'foo',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.coreAnnotation
  it('converts v2 span retaining an sr annotation', () => {
    const v2 = {
      traceId: '1',
      parentId: '1',
      id: '2',
      name: 'foo',
      timestamp: 1472470996199000,
      annotations: [
        { value: 'cs', timestamp: 1472470996199000 }
      ]
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'not_found',
      operationName: 'foo',
      startTime: 1472470996199000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'cs' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.server_shared_haystack_no_timestamp_duration
  it('converts shared server span without writing timestamp and duration', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 207000
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'backend',
      operationName: 'get',
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'sr' }]},
        { timestamp: 1472470996406000,
          fields: [{ key: 'event', value: 'ss' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.server_incomplete_shared
  it('converts incomplete shared server span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'get',
      kind: 'SERVER',
      shared: true,
      localEndpoint: backend,
      timestamp: 1472470996199000
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'backend',
      operationName: 'get',
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'sr' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ss
  it('converts late incomplete server span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'get',
      kind: 'SERVER',
      localEndpoint: backend,
      remoteEndpoint: frontend,
      annotations: [
        { value: 'ss', timestamp: 1472470996199000 }
      ]
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'backend',
      operationName: 'get',
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'ss' }]}
      ],
      tags: [
        { key: 'remote.service_name', value: 'frontend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.lateRemoteEndpoint_ca
  it('converts late remote endpoint server span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      kind: 'SERVER',
      remoteEndpoint: frontend
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'not_found',
      operationName: 'not_found',
      logs: [],
      tags: [
        { key: 'remote.service_name', value: 'frontend' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.localSpan_emptyComponent
  it('converts local span', () => {
    const v2 = {
      traceId: '1',
      id: '2',
      name: 'local',
      localEndpoint: {serviceName: 'frontend'},
      timestamp: 1472470996199000,
      duration: 207000
    };

    const haystack = {
      traceId: '0000000000000001',
      spanId: '0000000000000002',
      serviceName: 'frontend',
      operationName: 'local',
      startTime: 1472470996199000,
      duration: 207000,
      logs: [],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_remote
  it('converts incomplete producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      timestamp: 1472470996199000,
      localEndpoint: frontend
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'frontend',
      operationName: 'send',
      startTime: 1472470996199000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'ms' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.producer_duration
  it('converts producer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'PRODUCER',
      localEndpoint: frontend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'frontend',
      operationName: 'send',
      startTime: 1472470996199000,
      duration: 51000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'ms' }]},
        { timestamp: 1472470996250000,
          fields: [{ key: 'event', value: 'ws' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer
  it('converts incomplete consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'backend',
      operationName: 'next-message',
      startTime: 1472470996199000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'mr' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_remote
  it('converts incomplete consumer span with remote endpoint', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'next-message',
      kind: 'CONSUMER',
      timestamp: 1472470996199000,
      localEndpoint: backend,
      remoteEndpoint: { serviceName: 'kafka' }
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'backend',
      operationName: 'next-message',
      startTime: 1472470996199000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'mr' }]}
      ],
      tags: [
        { key: 'remote.service_name', value: 'kafka' }
      ]
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });

  // originally zipkin2.v1.SpanConverterTest.consumer_duration
  it('converts consumer span', () => {
    const v2 = {
      traceId: '1',
      parentId: '2',
      id: '3',
      name: 'send',
      kind: 'CONSUMER',
      localEndpoint: backend,
      timestamp: 1472470996199000,
      duration: 51000
    };

    const haystack = {
      traceId: '0000000000000001',
      parentSpanId: '0000000000000002',
      spanId: '0000000000000003',
      serviceName: 'backend',
      operationName: 'send',
      startTime: 1472470996199000,
      duration: 51000,
      logs: [
        { timestamp: 1472470996199000,
          fields: [{ key: 'event', value: 'wr' }]},
        { timestamp: 1472470996250000,
          fields: [{ key: 'event', value: 'mr' }]}
      ],
      tags: []
    };

    expect(converter.toHaystackSpan(v2)).to.deep.equal(haystack);
  });
});
