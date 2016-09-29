'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!', './constants'], function (_export, _context) {
    "use strict";

    var QueryCtrl, ALL_OPERATORS, DEFAULT_DEVICE, DEFAULT_GROUP_BY, DEFAULT_GROUP_BY_OP, DEFAULT_SELECT_FIELD, DEFAULT_SELECT_NS, DEFAULT_WHERE, _createClass, GenericDatasourceQueryCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            QueryCtrl = _appPluginsSdk.QueryCtrl;
        }, function (_cssQueryEditorCss) {}, function (_constants) {
            ALL_OPERATORS = _constants.ALL_OPERATORS;
            DEFAULT_DEVICE = _constants.DEFAULT_DEVICE;
            DEFAULT_GROUP_BY = _constants.DEFAULT_GROUP_BY;
            DEFAULT_GROUP_BY_OP = _constants.DEFAULT_GROUP_BY_OP;
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

            _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl = function (_QueryCtrl) {
                _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

                function GenericDatasourceQueryCtrl($scope, $injector, uiSegmentSrv) {
                    _classCallCheck(this, GenericDatasourceQueryCtrl);

                    var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

                    _this.scope = $scope;
                    _this.uiSegmentSrv = uiSegmentSrv;
                    _this.target.target = _this.target.target || DEFAULT_SELECT_FIELD;
                    _this.target.namespace = _this.target.namespace || DEFAULT_SELECT_NS;
                    _this.target.device_id = _this.target.device_id || DEFAULT_DEVICE;
                    _this.target.group_by_field = _this.target.group_by_field || DEFAULT_GROUP_BY;
                    _this.target.group_by_operator = _this.target.group_by_operator || DEFAULT_GROUP_BY_OP;
                    _this.target.interval = _this.target.interval || _this.panelCtrl.interval;

                    _this.target.wheres = _this.target.wheres || [[_this.uiSegmentSrv.newPlusButton()]];
                    for (var i = 0; i < _this.target.wheres.length; i++) {
                        for (var j = 0; j < _this.target.wheres[i].length; j++) {
                            var temp = _this.target.wheres[i][j];
                            if (temp.type === "clause") {
                                var newClause = _this.uiSegmentSrv.newSegment(temp.value);
                                newClause.cssClass = temp.cssClass;
                                newClause.type = temp.type;
                                _this.target.wheres[i][j] = newClause;
                            }
                        }
                    }

                    return _this;
                }

                /** Add a new where row to the UI, pushing down the plus button **/


                _createClass(GenericDatasourceQueryCtrl, [{
                    key: 'addWhereRow',
                    value: function addWhereRow(rowIdx) {
                        var field = this.uiSegmentSrv.newSegment(DEFAULT_WHERE);
                        field.cssClass = "io-segment io-where-clause";
                        field.type = "clause";
                        var del = this.uiSegmentSrv.newSegment("");
                        del.html = "<i class=\"fa fa-trash\"></i>";
                        del.type = "delete";
                        del.cssClass = "io-segment";
                        var button = this.uiSegmentSrv.newPlusButton();
                        button.cssClass = "io-segment-no-left";

                        console.log(field);
                        this.target.wheres[rowIdx] = [field, del];
                        this.target.wheres.push([button]);
                    }
                }, {
                    key: 'wheresClicked',
                    value: function wheresClicked(segment, rowIdx, idx) {
                        // Handle plus button clicks
                        if (segment.type === "plus-button") {
                            // Only add a row if the previous one is non-empty clause
                            if (rowIdx === 0 || this.target.wheres[rowIdx - 1][0].value !== DEFAULT_WHERE) {
                                this.addWhereRow(rowIdx);
                            } else {
                                // Prevents user from 'editting' the button
                                this.target.wheres[rowIdx][idx] = this.uiSegmentSrv.newPlusButton();
                            }
                        } else if (segment.type === "delete") {
                            // Handle delete clicks
                            this.target.wheres.splice(rowIdx, 1);
                            this.panelCtrl.refresh();
                        }
                        return new Promise(function () {});
                    }
                }, {
                    key: 'wheresUpdated',
                    value: function wheresUpdated(segment, rowIdx, idx) {
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'intervalClicked',
                    value: function intervalClicked() {
                        return new Promise(function () {});
                    }
                }, {
                    key: 'getOptions',
                    value: function getOptions() {
                        return this.datasource.fieldQuery(this.target).then(this.uiSegmentSrv.transformToSegments(false));
                    }
                }, {
                    key: 'getGroupByOptions',
                    value: function getGroupByOptions() {
                        return this.datasource.fieldQuery(this.target).then(function (results) {
                            console.log(results);
                            return [{ value: DEFAULT_GROUP_BY, text: DEFAULT_GROUP_BY }].concat(results);
                        }).then(this.uiSegmentSrv.transformToSegments(false));
                    }
                }, {
                    key: 'getNamespaces',
                    value: function getNamespaces() {
                        return this.datasource.namespaceQuery(this.target).then(this.uiSegmentSrv.transformToSegments(false));
                    }
                }, {
                    key: 'getDevices',
                    value: function getDevices() {
                        return this.datasource.deviceQuery(this.target).then(this.uiSegmentSrv.transformToSegments(false));
                    }
                }, {
                    key: 'getOperators',
                    value: function getOperators() {
                        var operators = ["mean", "max", "min", "sum", "count"];
                        return new Promise(function (resolve, reject) {
                            resolve(ALL_OPERATORS.map(function (v) {
                                return { text: v, value: v };
                            }));
                        }).then(this.uiSegmentSrv.transformToSegments(false));
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        this.target.rawQuery = !this.target.rawQuery;
                    }
                }, {
                    key: 'onChangeInternal',
                    value: function onChangeInternal() {
                        this.panelCtrl.refresh(); // Asks the panel to refresh data.
                    }
                }]);

                return GenericDatasourceQueryCtrl;
            }(QueryCtrl));

            _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl);

            GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map
