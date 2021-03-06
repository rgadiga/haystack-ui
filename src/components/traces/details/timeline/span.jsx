/*
 * Copyright 2018 Expedia Group
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

import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {observer} from 'mobx-react';

import SpanDetailsModal from './spanDetailsModal';
import formatters from '../../../../utils/formatters';
import serviceColor from '../../../../utils/serviceColorMapper';
import auxiliaryTags from '../../utils/auxiliaryTags';

const Span = observer(({
                           startTime,
                           index,
                           span,
                           totalDuration,
                           spanHeight,
                           timelineWidthPercent,
                           timePointersHeight,
                           parentStartTimePercent,
                           parentIndex,
                           toggleExpand
}) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const {
        serviceName,
        depth,
        expandable,
        expanded,
        startTimePercent,
        duration,
        operationName,
        spanId,
        traceId
    } = span;

    const getOffsetPercent = (absolutePercent) => (((absolutePercent * (timelineWidthPercent / 100)) + (100 - timelineWidthPercent)));

    const getSpanError = () => !!span.tags.find(
            tag => (tag.key === 'error' && (tag.value === true || (typeof tag.value === 'string' && tag.value !== 'false')))
        );

    const getTagValue = (tagName) => {
        const tag = span.tags.find(t => (t.key === tagName));
        return tag && tag.value;
    };

    const toggleChild = () => {
        toggleExpand(spanId);
    };

    const depthFactor = depth * 0.5;

    // coordinates
    const verticalPadding = 6;
    const topY = timePointersHeight + (index * spanHeight);

    // service pills
    const pillHeight = spanHeight - (2 * verticalPadding);
    const serviceNameBaseline = topY + verticalPadding + (pillHeight - 8);
    const maxServiceChars = 14;
    const serviceLabelWidth = (maxServiceChars * 7.5);
    const trimmedServiceName = serviceName.length > maxServiceChars ? `${serviceName.substr(0, maxServiceChars)}...` : serviceName;

    // merged span indicator
    const isMergedSpan = getTagValue(auxiliaryTags.IS_MERGED_SPAN);
    const isAutoGenerated = getTagValue(auxiliaryTags.IS_AUTOGENERATED_SPAN);
    const clientServiceName = getTagValue(auxiliaryTags.CLIENT_SERVICE_NAME);
    const clientOperationName = getTagValue(auxiliaryTags.CLIENT_OPERATION_NAME);

    const fullOperationName = isMergedSpan ?
        `${clientServiceName}: ${clientOperationName} + ${serviceName}: ${operationName}` :
        operationName;

    const ServiceName = (
        <g>
            {
                isMergedSpan &&
                <rect
                    className={`service-pill ${serviceColor.toFillClass(clientServiceName)}`}
                    height={pillHeight}
                    width={serviceLabelWidth}
                    y={topY + verticalPadding + 6}
                    x={`${depthFactor + 2 + 0.5}%`}
                    clipPath="url(#overflow)"
                />
            }
            <rect
                className={`service-pill ${serviceColor.toFillClass(serviceName)}`}
                height={pillHeight}
                width={serviceLabelWidth}
                y={topY + verticalPadding}
                x={`${depthFactor + 2}%`}
                clipPath="url(#overflow)"
            />
            <text
                className="span-service-label"
                x={`${depthFactor + 2.5}%`}
                y={serviceNameBaseline}
                clipPath="url(#overflow)"
            >{trimmedServiceName}
            </text>
        </g>);

    // span bar
    const leftOffsetPercent = getOffsetPercent(startTimePercent);
    const spanWidthPercent = ((duration / totalDuration) * 100) * (timelineWidthPercent / 100);
    const formattedDuration = `${formatters.toDurationString(duration)}`;
    const SpanBar = (<g>
        <text
            className={getSpanError(span) ? 'span-label span-label_failure' : 'span-label'}
            x={leftOffsetPercent > 70 ? `${leftOffsetPercent + spanWidthPercent}%` : `${leftOffsetPercent}%`}
            y={topY + (verticalPadding * 2)}
            textAnchor={leftOffsetPercent > 70 ? 'end' : 'start'}
        >{fullOperationName} [ {formattedDuration} ]
        </text>
        <rect
            id={traceId}
            className={getSpanError(span) ? 'span-bar span-bar_failure' : 'span-bar'}
            height={9}
            width={`${Math.max(spanWidthPercent, 0.4)}%`}
            x={leftOffsetPercent < 99.6 ? `${leftOffsetPercent}%` : '99.6%'}
            y={topY + (verticalPadding * 3)}
        />
        <rect
            className="span-click"
            width="100%"
            height={spanHeight}
            x={0}
            y={topY}
            onClick={() => setModalIsOpen(true)}
        >
            <title>{fullOperationName}</title>
        </rect>
    </g>);

    // client span bar
    const clientDuration = isMergedSpan && getTagValue(auxiliaryTags.CLIENT_DURATION);
    const clientStartTime = isMergedSpan && getTagValue(auxiliaryTags.CLIENT_START_TIME);
    const clientStartTimePercent = isMergedSpan && (((clientStartTime - startTime) / totalDuration) * 100);
    const clientLeftOffsetPercent = isMergedSpan && getOffsetPercent(clientStartTimePercent);
    const clientSpanWidthPercent = isMergedSpan && ((clientDuration / totalDuration) * 100) * (timelineWidthPercent / 100);
    const clientSpanId = isMergedSpan && getTagValue(auxiliaryTags.CLIENT_SPAN_ID);

    const ClientSpanBar = isMergedSpan && (<g>
        <rect
            id={traceId}
            className="span-bar span-bar_client"
            height={9}
            width={`${clientSpanWidthPercent}%`}
            x={`${clientLeftOffsetPercent}%`}
            y={topY + (verticalPadding * 3)}
        />
    </g>);

    // invocation lines
    const horizontalLineY = topY + (verticalPadding * 3.8);
    const parentOffsetPercent = getOffsetPercent(parentStartTimePercent);
    const InvocationLines = (<g>
        <line
            className="invocation-line"
            x1={`${parentOffsetPercent}%`}
            x2={`${parentOffsetPercent}%`}
            y1={(parentIndex * spanHeight) + timePointersHeight + (verticalPadding * 3.8)}
            y2={horizontalLineY}
        />
        <line
            className="invocation-line"
            x1={`${parentOffsetPercent}%`}
            x2={`${leftOffsetPercent}%`}
            y1={horizontalLineY}
            y2={horizontalLineY}
        />
    </g>);


    return (
        <g>
            <rect
                className="span-row"
                width="100%"
                height={spanHeight}
                x="0"
                y={topY}
                onClick={() => setModalIsOpen(true)}
            />

            {ClientSpanBar}
            {InvocationLines}
            {ServiceName}
            {SpanBar}
            {expandable
                ? <g>
                    <rect
                        id={spanId}
                        className="service-expand-pill"
                        height={pillHeight - 4}
                        width={18}
                        x={`${depthFactor + 0.1}%`}
                        y={topY + verticalPadding + 2}
                        onClick={toggleChild}
                    />
                    <text
                        className="service-expand-text"
                        x={`${depthFactor + 0.4}%`}
                        y={serviceNameBaseline + 2}
                        onClick={toggleChild}
                    >{expanded ? '-' : '+'}</text>
                </g>
                : null }
            <SpanDetailsModal
                isOpen={modalIsOpen}
                closeModal={() => setModalIsOpen(false)}
                span={span}
                startTime={startTime}
                clientServiceName={clientServiceName}
                fullOperationName={fullOperationName}
                clientSpanId={clientSpanId}
                isAutoGenerated={isAutoGenerated}
                isMergedSpan={isMergedSpan}
            />
            <clipPath id="overflow">
                <rect
                    x="0"
                    height="100%"
                    width={`${100 - timelineWidthPercent - 0.2}%`}
                />
            </clipPath>
        </g>
    );
});

Span.propTypes = {
    startTime: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    span: PropTypes.object.isRequired,
    totalDuration: PropTypes.number.isRequired,
    spanHeight: PropTypes.number.isRequired,
    timelineWidthPercent: PropTypes.number.isRequired,
    timePointersHeight: PropTypes.number.isRequired,
    parentStartTimePercent: PropTypes.number.isRequired,
    parentIndex: PropTypes.number.isRequired,
    toggleExpand: PropTypes.func.isRequired
};

export default Span;
