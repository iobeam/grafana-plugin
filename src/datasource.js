import _ from "lodash";
import {
    ALL_DEVICES,
    DEFAULT_DEVICE,
    DEFAULT_GROUP_BY,
    DEFAULT_SELECT_FIELD,
    DEFAULT_SELECT_NS,
    DEFAULT_WHERE
} from "./constants";

const DATA_URL = "/v1/data/";
const NAMESPACES_URL = "/v1/namespaces/";

/** Build string representing iobeam /data endpoint **/
function buildDataUrl(ns, field = "all") {
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
    const keys = Object.keys(params);
    let ret = "";
    let sep = "?";
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];

        let vals;
        if (params[k] instanceof Array) {
            vals = params[k]
        } else if (params[k]) {
            vals = [params[k]];
        } else {
            continue;
        }

        for (let v of vals) {
            ret += sep + encodeURIComponent(k) + "=" + encodeURIComponent(v);
            sep = "&"
        }
    }

    return ret;
}

function buildGroupByParam(t, interval) {
    const ret = {};
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
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].indexOf(field) > -1) {
            return i;
        }
    }
    return -1;
}

export class GenericDatasource {

    constructor(instanceSettings, $q, backendSrv, templateSrv) {
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
    parseQueryResults(results) {
        const filteredResult = [];
        const resultMap = new Map();
        for (let i = 0; i < results.length; i++) {
            const {device, field, result} = results[i];
            // Query parameters returned an empty set
            if (result.status === 200 && result.data.result.length === 0) {
                continue;
            }

            const {fields, values} = result.data.result[0];
            const fieldIdx = findFieldIdx(fields, field);
            const f = fields[fieldIdx];
            for (let j = 0; j < values.length; j++) {
                const row = values[j];
                const time = row[0];
                const val = row[fieldIdx];

                // remove value, keep only fields used in group by (non-time)
                const temp = row.slice(1);
                temp.splice(fieldIdx - 1, 1)  // -1 to account for removing first element
                // extra identifies the series uniquely among device + any group bys
                const extra = [device].concat(temp).join(",");
                const mapKey = f + " (" + extra + ")";

                const pts = resultMap.has(mapKey) ? resultMap.get(mapKey) : [];
                pts.push([val, time]);
                resultMap.set(mapKey, pts);
            }
        }

        // Each key is a graph series, need to sort the points from oldest to newest
        resultMap.forEach((v, k) => {
            const sorted = v.sort((a, b) => a[1] - b[1]);
            filteredResult.push({target: k, datapoints: sorted});
        });
        return {data: filteredResult};
    }

    // Called once per panel (graph)
    query(options) {
        console.log(options);
        const query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);
        if (query.targets.length <= 0) {
            return this.q.when({data: []});
        } else if (query.targets.length === 1 && !query.targets[0].target) {
            return this.q.when({data: []});
        }

        const reqs = [];
        // For each 'query', we must build a request to iobeam, where a
        // request is {device: ..., url: ...}. 'device' tells us
        // the device this is for (to pass along to parsing function), and
        // 'url' is the iobeam backend url to hit.
        for (let i = 0 ; i < query.targets.length; i++) {
            const t = query.targets[i];
            const req = {
                device: t.device_id,
                field: t.target
            };

            const queryParams = {
                limit: query.maxDataPoints || 1000
            };

            if (query.range) {  // create time clause
                const from = query.range.from.toDate().getTime();
                const to = query.range.to.toDate().getTime();
                queryParams.time = from + "," + to;
            }

            // Set up all where clauses, incl device_id equality
            queryParams.where = [];
            if (t.device_id !== ALL_DEVICES) {
                queryParams.where.push("eq(device_id," + t.device_id + ")");
            }
            if (t.wheres && t.wheres.length > 0) {
                for (let j = 0; j < t.wheres.length; j++) {
                    queryParams.where.push(t.wheres[j]);
                }
            }

            // Group by query params
            Object.assign(queryParams, buildGroupByParam(t, (t.interval || query.interval)));

            req.url = this.url + buildDataUrl(t.namespace, t.target) + buildUrlQueryStr(queryParams);
            reqs.push(req);
        }

        // Helper function to create the headers for each request.
        const headers = this.headers;
        const makeDataSourceRequest = (req) => {
            return {
                method: "GET",
                headers: headers,
                url: req.url
            };
        };

        const resps = [];
        // Helper function to generate the callback for each request.
        // The callback first pushes the response onto the collection `resps`,
        // which will be parsed at the end. Then if there are further requests,
        // it launches the next one with a similar callback. If there are no
        // more requests, it parses all the collected responses.
        const intermdiateFn = (device, field) => {
            return (result) => {
                resps.push({device: device, field: field, result: result});
                if (reqs.length === 0) {
                    return this.parseQueryResults(resps);
                } else {
                    const req = reqs.shift();
                    return this.backendSrv.datasourceRequest(makeDataSourceRequest(req))
                        .then(intermdiateFn(req.device, req.field));
                }
            }
        }

        const req = reqs.shift();
        return this.backendSrv.datasourceRequest(makeDataSourceRequest(req))
            .then(intermdiateFn(req.device, req.field));
    }

    // Required
    // Used for testing datasource in datasource configuration page
    testDatasource() {
        return this.backendSrv.datasourceRequest({
            url: this.url + "/v1/ping",
            method: "GET"
        }).then(response => {
            if (response.status === 200) {
                return { status: "success", message: "Data source is working.", title: "Success" };
            }
        });
    }

    /** Get the list of devices for a namespace **/
    deviceQuery(options) {
        const ns = options.namespace;
        return this.backendSrv.datasourceRequest({
            url: this.url + buildDataUrl(ns, "device_id") + "?limit_by=device_id,1&limit=1000",
            data: options,
            method: "GET",
            headers: this.headers
        }).then(result => {
            const {values} = result.data.result[0];
            const sorted = values.sort((a, b) => {
                return a[1].localeCompare(b[1]);
            });
            sorted.unshift([null, ALL_DEVICES])
            return _.map(sorted, (row) => {
                return {text: row[1], value: row[1]};
            });
        });
    }

    /** Get the list of fields for a namespace **/
    fieldQuery(options) {
        if (!options.namespace || options.namespace === DEFAULT_SELECT_NS) {
            return this.q.when([]);    
        }
        return this.backendSrv.datasourceRequest({
            url: this.url + buildDataUrl(options.namespace)+ "?limit=1",
            data: options,
            method: "GET",
            headers: this.headers
        }).then(result => {
            const {fields} = result.data.result[0];
            return _.map(fields.slice(1), (f) => {
                return {text: f, value: f};
            });
        });
    }

    /** Get the namespaces for a project **/
    namespaceQuery(options) {
        return this.backendSrv.datasourceRequest({
            url: this.url + NAMESPACES_URL,
            data: options,
            method: "GET",
            headers: this.headers
        }).then(result => {
            const {namespaces} = result.data;
            return _.map(namespaces, (ns) => {
                return {text: ns.namespace_name, value: ns.namespace_name};
            });
        });
    }

    buildQueryParameters(options) {
        // remove placeholder targets
        options.targets = _.filter(options.targets, target => {
            return target.target !== DEFAULT_SELECT_FIELD
                && target.namespace !== DEFAULT_SELECT_NS
                && target.device_id !== DEFAULT_DEVICE;
        });

        var targets = _.map(options.targets, target => {
            const wheres = [];
            if (target.wheres) {
                for (let i = 0; i < target.wheres.length; i++) {
                    const row = target.wheres[i];
                    if (row.length > 1 && row[0].value !== "") {
                        wheres.push(row[0].value);
                    }
                }
            }

            const group_by = !target.group_by_field ? null : {
                field: target.group_by_field,
                operator: target.group_by_operator
            };

            return {
                target: this.templateSrv.replace(target.target),
                namespace: this.templateSrv.replace(target.namespace),
                device_id: this.templateSrv.replace(target.device_id),
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
}
