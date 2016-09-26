"use strict";

System.register(["lodash", "./constants"], function (_export, _context) {
    "use strict";

    var _, ALL_DEVICES, DEFAULT_DEVICE, DEFAULT_GROUP_BY, DEFAULT_SELECT_FIELD, DEFAULT_SELECT_NS, DEFAULT_WHERE, _createClass, DATA_URL, NAMESPACES_URL, GenericDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    /** Build string representing iobeam /data endpoint **/
    function buildDataUrl(ns) {
        var field = arguments.length <= 1 || arguments[1] === undefined ? "all" : arguments[1];

        return DATA_URL + ns + "/" + field;
    }

    /**
     * Build string representing the query string from a map of params.
     *
     * params {object} - Key-value pairings to encode. If a value is a string,
     *                  a single copy of the key is added with that value. If it is
     *                  an array, multiple copies of that key are added for each
     *                  value.
     **/
    function buildUrlQueryStr(params) {
        var keys = Object.keys(params);
        var ret = "";
        var sep = "?";
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];

            var vals = void 0;
            if (params[k] instanceof Array) {
                vals = params[k];
            } else if (params[k]) {
                vals = [params[k]];
            } else {
                continue;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = vals[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var v = _step.value;

                    ret += sep + encodeURIComponent(k) + "=" + encodeURIComponent(v);
                    sep = "&";
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        return ret;
    }

    function buildGroupByParam(t, interval) {
        var ret = {};
        if (interval) {
            ret.group_by = "time(" + interval + ")";
            ret.operator = "mean";
        }

        if (t.group_by) {
            if (t.group_by.field !== DEFAULT_GROUP_BY) {
                if (ret.group_by) {
                    ret.group_by += ",";
                }
                ret.group_by += t.group_by.field;
            }
            ret.operator = t.group_by.operator;
        }

        return ret;
    }

    /**
     * Used to find which element in fields corresponds to field, by looking
     * for field as a substring so it matches things like 'avg(field)' as well
     * 'field'.
     *
     * fields {array} - Array of fields to search in
     * field {string} - Substring to search for
     **/
    function findFieldIdx(fields, field) {
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].indexOf(field) > -1) {
                return i;
            }
        }
        return -1;
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_constants) {
            ALL_DEVICES = _constants.ALL_DEVICES;
            DEFAULT_DEVICE = _constants.DEFAULT_DEVICE;
            DEFAULT_GROUP_BY = _constants.DEFAULT_GROUP_BY;
            DEFAULT_SELECT_FIELD = _constants.DEFAULT_SELECT_FIELD;
            DEFAULT_SELECT_NS = _constants.DEFAULT_SELECT_NS;
            DEFAULT_WHERE = _constants.DEFAULT_WHERE;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            DATA_URL = "/v1/data/";
            NAMESPACES_URL = "/v1/namespaces/";

            _export("GenericDatasource", GenericDatasource = function () {
                function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, GenericDatasource);

                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    if (instanceSettings.jsonData) {
                        this.pid = parseInt(instanceSettings.jsonData.iobeam_project_id);
                        this.token = instanceSettings.jsonData.iobeam_project_token;
                    }
                    this.q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;

                    this.headers = {
                        "Accept-Type": "application/json",
                        "Authorization": "Bearer " + this.token
                    };
                }

                /**
                 * Parse each query result and create a single datasource response that
                 * Grafana expects.
                 *
                 * results {array} - An array of objects of the form {device: ..., result: ...}
                 * which contains the http result for a given device.
                 **/


                _createClass(GenericDatasource, [{
                    key: "parseQueryResults",
                    value: function parseQueryResults(results) {
                        var filteredResult = [];
                        var resultMap = new Map();
                        for (var i = 0; i < results.length; i++) {
                            var _results$i = results[i];
                            var device = _results$i.device;
                            var field = _results$i.field;
                            var result = _results$i.result;

                            // Query parameters returned an empty set
                            if (result.status === 200 && result.data.result.length === 0) {
                                continue;
                            }

                            var _result$data$result$ = result.data.result[0];
                            var fields = _result$data$result$.fields;
                            var values = _result$data$result$.values;

                            var fieldIdx = findFieldIdx(fields, field);
                            var f = fields[fieldIdx];
                            for (var j = 0; j < values.length; j++) {
                                var row = values[j];
                                var time = row[0];
                                var val = row[fieldIdx];

                                // remove value, keep only fields used in group by (non-time)
                                var temp = row.slice(1);
                                temp.splice(fieldIdx - 1, 1); // -1 to account for removing first element
                                // extra identifies the series uniquely among device + any group bys
                                var extra = [device].concat(temp).join(",");
                                var mapKey = f + " (" + extra + ")";

                                var pts = resultMap.has(mapKey) ? resultMap.get(mapKey) : [];
                                pts.push([val, time]);
                                resultMap.set(mapKey, pts);
                            }
                        }

                        // Each key is a graph series, need to sort the points from oldest to newest
                        resultMap.forEach(function (v, k) {
                            var sorted = v.sort(function (a, b) {
                                return a[1] - b[1];
                            });
                            filteredResult.push({ target: k, datapoints: sorted });
                        });
                        return { data: filteredResult };
                    }
                }, {
                    key: "query",
                    value: function query(options) {
                        var _this = this;

                        console.log(options);
                        var query = this.buildQueryParameters(options);
                        query.targets = query.targets.filter(function (t) {
                            return !t.hide;
                        });
                        if (query.targets.length <= 0) {
                            return this.q.when({ data: [] });
                        } else if (query.targets.length === 1 && !query.targets[0].target) {
                            return this.q.when({ data: [] });
                        }

                        var reqs = [];
                        // For each 'query', we must build a request to iobeam, where a
                        // request is {device: ..., url: ...}. 'device' tells us
                        // the device this is for (to pass along to parsing function), and
                        // 'url' is the iobeam backend url to hit.
                        for (var i = 0; i < query.targets.length; i++) {
                            var t = query.targets[i];
                            var _req = {
                                device: t.device_id,
                                field: t.target
                            };

                            var queryParams = {
                                limit: query.maxDataPoints || 1000
                            };

                            if (query.range) {
                                // create time clause
                                var from = query.range.from.toDate().getTime();
                                var to = query.range.to.toDate().getTime();
                                queryParams.time = from + "," + to;
                            }

                            // Set up all where clauses, incl device_id equality
                            queryParams.where = [];
                            if (t.device_id !== ALL_DEVICES) {
                                queryParams.where.push("eq(device_id," + t.device_id + ")");
                            }
                            if (t.wheres && t.wheres.length > 0) {
                                for (var j = 0; j < t.wheres.length; j++) {
                                    queryParams.where.push(t.wheres[j]);
                                }
                            }

                            // Group by query params
                            Object.assign(queryParams, buildGroupByParam(t, t.interval || query.interval));

                            _req.url = this.url + buildDataUrl(t.namespace, t.target) + buildUrlQueryStr(queryParams);
                            reqs.push(_req);
                        }

                        // Helper function to create the headers for each request.
                        var headers = this.headers;
                        var makeDataSourceRequest = function makeDataSourceRequest(req) {
                            return {
                                method: "GET",
                                headers: headers,
                                url: req.url
                            };
                        };

                        var resps = [];
                        // Helper function to generate the callback for each request.
                        // The callback first pushes the response onto the collection `resps`,
                        // which will be parsed at the end. Then if there are further requests,
                        // it launches the next one with a similar callback. If there are no
                        // more requests, it parses all the collected responses.
                        var intermdiateFn = function intermdiateFn(device, field) {
                            return function (result) {
                                resps.push({ device: device, field: field, result: result });
                                if (reqs.length === 0) {
                                    return _this.parseQueryResults(resps);
                                } else {
                                    var _req2 = reqs.shift();
                                    return _this.backendSrv.datasourceRequest(makeDataSourceRequest(_req2)).then(intermdiateFn(_req2.device, _req2.field));
                                }
                            };
                        };

                        var req = reqs.shift();
                        return this.backendSrv.datasourceRequest(makeDataSourceRequest(req)).then(intermdiateFn(req.device, req.field));
                    }
                }, {
                    key: "testDatasource",
                    value: function testDatasource() {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + "/v1/ping",
                            method: "GET"
                        }).then(function (response) {
                            if (response.status === 200) {
                                return { status: "success", message: "Data source is working.", title: "Success" };
                            }
                        });
                    }
                }, {
                    key: "deviceQuery",
                    value: function deviceQuery(options) {
                        var ns = options.namespace;
                        return this.backendSrv.datasourceRequest({
                            url: this.url + buildDataUrl(ns, "device_id") + "?limit_by=device_id,1&limit=1000",
                            data: options,
                            method: "GET",
                            headers: this.headers
                        }).then(function (result) {
                            var values = result.data.result[0].values;

                            var sorted = values.sort(function (a, b) {
                                return a[1].localeCompare(b[1]);
                            });
                            sorted.unshift([null, ALL_DEVICES]);
                            return _.map(sorted, function (row) {
                                return { text: row[1], value: row[1] };
                            });
                        });
                    }
                }, {
                    key: "fieldQuery",
                    value: function fieldQuery(options) {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + buildDataUrl("input") + "?limit=1",
                            data: options,
                            method: "GET",
                            headers: this.headers
                        }).then(function (result) {
                            var fields = result.data.result[0].fields;

                            return _.map(fields.slice(1), function (f) {
                                return { text: f, value: f };
                            });
                        });
                    }
                }, {
                    key: "namespaceQuery",
                    value: function namespaceQuery(options) {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + NAMESPACES_URL,
                            data: options,
                            method: "GET",
                            headers: this.headers
                        }).then(function (result) {
                            var namespaces = result.data.namespaces;

                            return _.map(namespaces, function (ns) {
                                return { text: ns.namespace_name, value: ns.namespace_name };
                            });
                        });
                    }
                }, {
                    key: "buildQueryParameters",
                    value: function buildQueryParameters(options) {
                        var _this2 = this;

                        // remove placeholder targets
                        options.targets = _.filter(options.targets, function (target) {
                            return target.target !== DEFAULT_SELECT_FIELD && target.namespace !== DEFAULT_SELECT_NS && target.device_id !== DEFAULT_DEVICE;
                        });

                        var targets = _.map(options.targets, function (target) {
                            var wheres = [];
                            if (target.wheres) {
                                for (var i = 0; i < target.wheres.length; i++) {
                                    var row = target.wheres[i];
                                    if (row.length > 1 && row[0].value !== DEFAULT_WHERE) {
                                        wheres.push(row[0].value);
                                    }
                                }
                            }

                            var group_by = !target.group_by_field ? null : {
                                field: target.group_by_field,
                                operator: target.group_by_operator
                            };

                            return {
                                target: _this2.templateSrv.replace(target.target),
                                namespace: _this2.templateSrv.replace(target.namespace),
                                device_id: _this2.templateSrv.replace(target.device_id),
                                group_by: group_by,
                                wheres: wheres,
                                interval: target.interval,
                                refId: target.refId,
                                hide: target.hide
                            };
                        });

                        options.targets = targets;

                        return options;
                    }
                }]);

                return GenericDatasource;
            }());

            _export("GenericDatasource", GenericDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
