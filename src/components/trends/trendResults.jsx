/*
 * Copyright 2017 Expedia, Inc.
 *
 *       Licensed under the Apache License, Version 2.0 (the "License");
 *       you may not use this file except in compliance with the License.
 *       You may obtain a copy of the License at
 *
 *           http://www.apache.org/licenses/LICENSE-2.0
 *
 *       Unless required by applicable law or agreed to in writing, software
 *       distributed under the License is distributed on an "AS IS" BASIS,
 *       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *       See the License for the specific language governing permissions and
 *       limitations under the License.
 *
 */

import React from 'react';
import {observer} from 'mobx-react';
import PropTypes from 'prop-types';
import moment from 'moment';

import Loading from '../common/loading';
import TrendResultsTable from './trendResultsTable';
import Error from '../common/error';
import NoSearch from '../common/noSearch';

@observer
export default class TrendResults extends React.Component {
    static propTypes = {
        trendsSearchStore: PropTypes.object.isRequired,
        match: PropTypes.object.isRequired
    };
    constructor(props) {
        super(props);

        const query = {
            serviceName: `${this.props.match.params.serviceName}`,
            timespan: 3600,
            from: moment(new Date()).subtract(3600, 'seconds').valueOf(),
            until: moment(new Date()).valueOf()
        };
        this.props.trendsSearchStore.fetchSearchResults(query);
    }

    render() {
        return (
            <section>
                { this.props.trendsSearchStore.promiseState && this.props.trendsSearchStore.promiseState.case({
                    pending: () => <Loading />,
                    rejected: () => <Error />,
                    empty: () => <NoSearch />,
                    fulfilled: () => ((this.props.trendsSearchStore.searchResults && this.props.trendsSearchStore.searchResults.length)
                        ? <TrendResultsTable match={this.props.match} store={this.props.trendsSearchStore}/>
                        : <Error />)
                })
                }
            </section>
        );
    }
}
