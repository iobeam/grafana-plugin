"use strict";

System.register(["lodash", "./constants"], function (_export, _context) {
    "use strict";

    var _, USER_TOKEN_KEY, SELF_ADDRESS, ALL_DEVICES, DEFAULT_DEVICE, DEFAULT_SELECT_FIELD, DEFAULT_SELECT_NS, DEFAULT_SELECT_PROJECT, LAST_PROJECT_TOKEN, NONE, _createClass, DATA_URL, NAMESPACES_URL, PROJECTS_URL, iobeamDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    /** Build string representing iobeam /data endpoint **/
    function buildDataUrl(ns) {
        var field = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "all";

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
        if (t.group_by) {
            if (t.group_by.operator && interval && t.group_by.operator !== NONE) {
                ret.group_by = "time(" + interval + ")";
                ret.operator = t.group_by.operator;
            }

            if (t.group_by.field && t.group_by.field !== NONE) {
                if (ret.group_by) {
                    ret.group_by += ",";
                }
                ret.group_by += t.group_by.field;
            }
        }

        return ret;
    }

    function buildLimitByParam(t) {
        if (t.limit_by) {
            if (t.limit_by.field !== NONE) {
                var _t$limit_by = t.limit_by,
                    limit = _t$limit_by.limit,
                    field = _t$limit_by.field;

                return {
                    "limit_by": field + "," + limit
                };
            }
        }
        return {};
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

    function buildAuthHeader(token) {
        var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Bearer";

        return {
            "Authorization": prefix + " " + token,
            "Accept-Type": "application/json",
            "Access-Control-Allow-Origin": SELF_ADDRESS
        };
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_constants) {
            USER_TOKEN_KEY = _constants.USER_TOKEN_KEY;
            SELF_ADDRESS = _constants.SELF_ADDRESS;
            ALL_DEVICES = _constants.ALL_DEVICES;
            DEFAULT_DEVICE = _constants.DEFAULT_DEVICE;
            DEFAULT_SELECT_FIELD = _constants.DEFAULT_SELECT_FIELD;
            DEFAULT_SELECT_NS = _constants.DEFAULT_SELECT_NS;
            DEFAULT_SELECT_PROJECT = _constants.DEFAULT_SELECT_PROJECT;
            LAST_PROJECT_TOKEN = _constants.LAST_PROJECT_TOKEN;
            NONE = _constants.NONE;
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
            PROJECTS_URL = "/v1/projects/";

            _export("iobeamDatasource", iobeamDatasource = function () {
                function iobeamDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, iobeamDatasource);

                    this.localStorage = window.localStorage;
                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.userToken = instanceSettings.jsonData.iobeam_user_token;
                    this.projectToken = "";
                    this.q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                }

                /**
                 * Parse each query result and create a single datasource response that
                 * Grafana expects.
                 *
                 * results {array} - An array of objects of the form {device: ..., result: ...}
                 * which contains the http result for a given device.
                 **/


                _createClass(iobeamDatasource, [{
                    key: "parseQueryResults",
                    value: function parseQueryResults(results) {
                        var filteredResult = [];
                        var resultMap = new Map();
                        for (var i = 0; i < results.length; i++) {
                            var _results$i = results[i],
                                device = _results$i.device,
                                field = _results$i.field,
                                result = _results$i.result;

                            // Query parameters returned an empty set
                            if (result.status === 200 && result.data.result.length === 0) {
                                continue;
                            }
                            var _result$data$result$ = result.data.result[0],
                                fields = _result$data$result$.fields,
                                values = _result$data$result$.values;

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
                    key: "getUserToken",
                    value: function getUserToken() {
                        if (this.localStorage[USER_TOKEN_KEY]) {
                            return this.localStorage.getItem(USER_TOKEN_KEY);
                        } else if (this.userToken) {
                            this.localStorage.setItem(USER_TOKEN_KEY, this.userToken);
                            return this.userToken;
                        } else {
                            console.log("User token not set");
                            return "";
                        }
                    }
                }, {
                    key: "query",
                    value: function query(options) {
                        var _this = this;

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

                        var _loop = function _loop(i) {
                            var t = query.targets[i];
                            var req = {
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

                            // Group by & limit by query params
                            Object.assign(queryParams, buildGroupByParam(t, t.interval || query.interval));
                            Object.assign(queryParams, buildLimitByParam(t));

                            req.url = _this.url + buildDataUrl(t.namespace, t.target) + buildUrlQueryStr(queryParams);
                            req.project = t.project;
                            _this.getProjectToken(t.project, function (token) {
                                req.token = token;
                                if (token) {
                                    reqs.push(req);
                                }
                            });
                        };

                        for (var i = 0; i < query.targets.length; i++) {
                            _loop(i);
                        }

                        // Helper function to create the headers for each request.
                        var makeDataSourceRequest = function makeDataSourceRequest(req) {
                            return {
                                method: "GET",
                                headers: buildAuthHeader(req.token),
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
                                    var _req = reqs.shift();
                                    return _this.backendSrv.datasourceRequest(makeDataSourceRequest(_req)).then(intermdiateFn(_req.device, _req.field));
                                }
                            };
                        };
                        if (reqs.length > 0) {
                            var _req2 = reqs.shift();
                            return this.backendSrv.datasourceRequest(makeDataSourceRequest(_req2)).then(intermdiateFn(_req2.device, _req2.field));
                        } else {
                            return null;
                        }
                    }
                }, {
                    key: "testDatasource",
                    value: function testDatasource() {
                        this.localStorage.setItem(USER_TOKEN_KEY, this.userToken);

                        return this.backendSrv.datasourceRequest({
                            url: this.url + "/v1/projects",
                            method: "GET",
                            headers: buildAuthHeader(this.userToken)
                        }).then(function (response) {
                            if (response.status === 200) {
                                return { status: "success", message: "Data source is working.  Make sure you use 'https'", title: "Success" };
                                // } else if (response.status === 200) {
                                //     return {status: "failure", message: "Please use 'https'", title: "Wrong scheme"};
                            } else {
                                return "";
                            }
                        });
                    }
                }, {
                    key: "getProjectToken",
                    value: function getProjectToken(project, innerFn) {
                        var _this2 = this;

                        var project_id = project ? project.match(/\(([0-9]+)\)/)[1] : this.project_id;
                        //get stored token if it exists
                        if (!project_id) {
                            var token = this.project_token || this.localStorage[LAST_PROJECT_TOKEN];
                            if (token) {
                                return innerFn(token);
                            }
                            return null;
                        } else if (this.localStorage[project_id]) {
                            return innerFn(this.localStorage.getItem(project_id));
                        } else {
                            return this.backendSrv.datasourceRequest({
                                url: this.url + "/v1/tokens/project?project_id=" + project_id,
                                method: "GET",
                                headers: buildAuthHeader(this.getUserToken())
                            }).then(function (response) {
                                if (response.status === 200) {
                                    _this2.localStorage.setItem(project_id, response.data.token);
                                    _this2.localStorage.setItem(LAST_PROJECT_TOKEN, response.data.token);
                                    _this2.project_id = project_id;
                                    _this2.projectToken = response.data.token;
                                    return innerFn(response.data.token);
                                } else {
                                    console.log("Error retreiving project token");
                                    return "";
                                }
                            });
                        }
                    }
                }, {
                    key: "deviceQuery",
                    value: function deviceQuery(options) {
                        var _this3 = this;

                        var ns = options.namespace;
                        return this.getProjectToken(options.project, function (token) {
                            return _this3.backendSrv.datasourceRequest({
                                url: _this3.url + buildDataUrl(ns, "device_id") + "?limit_by=device_id,1&limit=1000",
                                data: options, //TODO(scao) - is this needed?
                                method: "GET",
                                headers: buildAuthHeader(token)
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
                        });
                    }
                }, {
                    key: "fieldQuery",
                    value: function fieldQuery(options) {
                        var _this4 = this;

                        if (!options.namespace || options.namespace === DEFAULT_SELECT_NS) {
                            return this.q.when([]);
                        }
                        return this.getProjectToken(options.project, function (token) {
                            return _this4.backendSrv.datasourceRequest({
                                url: _this4.url + buildDataUrl(options.namespace) + "?limit=1",
                                data: options, //TODO(scao) - is this needed?
                                method: "GET",
                                headers: buildAuthHeader(token)
                            }).then(function (result) {
                                var fields = result.data.result[0].fields;

                                return _.map(fields.slice(1), function (f) {
                                    return { text: f, value: f };
                                });
                            });
                        });
                    }
                }, {
                    key: "namespaceQuery",
                    value: function namespaceQuery(options) {
                        var _this5 = this;

                        return this.getProjectToken(options.project, function (token) {
                            return _this5.backendSrv.datasourceRequest({
                                url: _this5.url + NAMESPACES_URL,
                                method: "GET",
                                headers: buildAuthHeader(token)
                            }).then(function (result) {
                                var namespaces = result.data.namespaces;

                                return _.map(namespaces, function (ns) {
                                    return { text: ns.namespace_name, value: ns.namespace_name };
                                });
                            });
                        });
                    }
                }, {
                    key: "projectQuery",
                    value: function projectQuery() {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + PROJECTS_URL,
                            method: "GET",
                            headers: buildAuthHeader(this.getUserToken())
                        }).then(function (result) {
                            var projects = result.data.projects;

                            return _.map(projects, function (project) {
                                var text = project.project_name + "(" + project.project_id + ")";
                                return { text: text, value: project.project_id };
                            });
                        });
                    }
                }, {
                    key: "limitByFieldsQuery",
                    value: function limitByFieldsQuery(options) {
                        var _this6 = this;

                        if (!options.namespace || options.namespace === DEFAULT_SELECT_NS) {
                            return this.q.when([]);
                        }
                        return this.getProjectToken(options.project, function (token) {
                            return _this6.backendSrv.datasourceRequest({
                                url: _this6.url + NAMESPACES_URL + buildUrlQueryStr({ namespace_name: options.namespace }),
                                data: options, //TODO(scao) - is this needed?
                                method: "GET",
                                headers: buildAuthHeader()
                            }).then(function (result) {
                                var namespaces = result.data.namespaces;
                                var labels = namespaces[0].labels;

                                var temp = _.filter(Object.keys(labels), function (label) {
                                    return label.indexOf(":distinct") !== -1;
                                });
                                return _.map(temp, function (label) {
                                    var idx = label.indexOf(":distinct");
                                    var val = label.substring(0, idx);
                                    return { text: val, value: val };
                                });
                            });
                        });
                    }
                }, {
                    key: "metricFindQuery",
                    value: function metricFindQuery() {}
                }, {
                    key: "buildQueryParameters",
                    value: function buildQueryParameters(options) {
                        var _this7 = this;

                        // remove placeholder targets
                        options.targets = _.filter(options.targets, function (target) {
                            return target.target !== DEFAULT_SELECT_FIELD && target.namespace !== DEFAULT_SELECT_NS && target.device_id !== DEFAULT_DEVICE && target.project !== DEFAULT_SELECT_PROJECT;
                        });

                        var targets = _.map(options.targets, function (target) {
                            var wheres = [];
                            if (target.wheres) {
                                for (var i = 0; i < target.wheres.length; i++) {
                                    var row = target.wheres[i];
                                    if (row.length > 1 && row[0].value !== "") {
                                        wheres.push(row[0].value);
                                    }
                                }
                            }

                            var group_by = {};
                            if (target.group_by_operator) {
                                group_by.operator = target.group_by_operator;
                            }
                            if (target.group_by_field) {
                                group_by.field = target.group_by_field;
                            }

                            var limit_by = !target.limit_by_field ? null : {
                                field: target.limit_by_field,
                                limit: target.limit_by_count
                            };

                            return {
                                target: _this7.templateSrv.replace(target.target),
                                namespace: _this7.templateSrv.replace(target.namespace),
                                device_id: _this7.templateSrv.replace(target.device_id),
                                project: target.project,
                                group_by: group_by,
                                limit_by: limit_by,
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

                return iobeamDatasource;
            }());

            _export("iobeamDatasource", iobeamDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
