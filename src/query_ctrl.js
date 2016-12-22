import {QueryCtrl} from "app/plugins/sdk";
import "./css/query-editor.css!";
import {
    ALL_OPERATORS,
    DEFAULT_DEVICE,
    DEFAULT_GROUP_BY_OP,
    DEFAULT_SELECT_FIELD,
    DEFAULT_SELECT_NS,
    DEFAULT_SELECT_PROJECT,
    DEFAULT_WHERE,
    NONE
} from "./constants";

export class iobeamDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv)  {
        super($scope, $injector);

        this.scope = $scope;
        this.uiSegmentSrv = uiSegmentSrv;
        this.target.target = this.target.target || DEFAULT_SELECT_FIELD;
        this.target.project = this.target.project || DEFAULT_SELECT_PROJECT;
        this.target.namespace = this.target.namespace || DEFAULT_SELECT_NS;
        this.target.device_id = this.target.device_id || DEFAULT_DEVICE;
        this.target.group_by_field = this.target.group_by_field || NONE;
        this.target.group_by_operator = this.target.group_by_operator || DEFAULT_GROUP_BY_OP;
        this.target.interval = this.target.interval || this.panelCtrl.interval;
        this.target.limit_by_field = this.target.limit_by_field || NONE;
        this.target.limit_by_count = this.target.limit_by_count || 1;

        this.target.wheres = this.target.wheres || [[this.uiSegmentSrv.newPlusButton()]];
        for (let i = 0; i < this.target.wheres.length; i++) {
            for (let j = 0; j < this.target.wheres[i].length; j++) {
                const temp = this.target.wheres[i][j];
                if (temp.type === "clause") {
                    const newClause = this.uiSegmentSrv.newSegment(temp.value);
                    newClause.cssClass = temp.cssClass;
                    newClause.type = temp.type;
                    this.target.wheres[i][j] = newClause;
                }
            }
        }

    }

    /** Add a new where row to the UI, pushing down the plus button **/
    addWhereRow(rowIdx) {
        const field = this.uiSegmentSrv.newSegment("");
        field.cssClass = "io-segment io-where-clause";
        field.type = "clause";
        const del = this.uiSegmentSrv.newSegment("");
        del.html = "<i class=\"fa fa-trash\"></i>";
        del.type = "delete";
        del.cssClass = "io-segment";
        const button = this.uiSegmentSrv.newPlusButton();
        button.cssClass = "io-segment-no-left";

        this.target.wheres[rowIdx] = [field, del];
        this.target.wheres.push([button]);
    }

    // Only handles clicks for plus buttons and delete buttons
    wheresClicked(segment, rowIdx, idx) {
        // Handle plus button clicks
        if (segment.type === "plus-button") {
            // Only add a row if the previous one is non-empty clause
            if (rowIdx === 0 || this.target.wheres[rowIdx - 1][0].value !== "") {
                this.addWhereRow(rowIdx);
            } else {  // Prevents user from 'editting' the button
                this.target.wheres[rowIdx][idx] = this.uiSegmentSrv.newPlusButton();
            }
        } else if (segment.type === "delete") {  // Handle delete clicks
            this.target.wheres.splice(rowIdx, 1);
            this.panelCtrl.refresh();
        }
        return new Promise(() => {});
    }

    wheresUpdated(segment, rowIdx, idx) {
        this.panelCtrl.refresh();
    }

    // Handles when a clause is actually entered
    wheresEntered(event, rowIdx, idx) {
        if (event && event.target) {
            this.target.wheres[rowIdx][idx].value = event.target.value;
            this.panelCtrl.refresh();
        }
    }

    limitCount(event) {
        this.target.limit_by_count = event.target.value;
        this.panelCtrl.refresh();
    }

    // No options for clicking on interval, just a text field.
    intervalClicked() {
        return new Promise(() => {});
    }

    getOptions() {
        return this.datasource.fieldQuery(this.target)
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getGroupByOptions() {
        return this.datasource.fieldQuery(this.target)
            .then((results) => {
                return [{value: NONE, text: NONE}].concat(results);
            })
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getLimitByOptions() {
        return this.datasource.limitByFieldsQuery(this.target)
            .then((results) => {
                return [{value: NONE, text: NONE}].concat(results);
            })
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getProjects() {
        return this.datasource.projectQuery(this.target)
            .then((results) => {
                return [{text: NONE, value: NONE}].concat(results);
            })
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getNamespaces() {
        return this.datasource.namespaceQuery(this.target)
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getDevices() {
        return this.datasource.deviceQuery(this.target)
            .then(this.uiSegmentSrv.transformToSegments(false));
    }

    getOperators() {
        const operators = [NONE].concat(ALL_OPERATORS);
        return new Promise((resolve) => {
            resolve(operators.map((v) => {
                return {text: v, value: v};
            }));
        }).then(this.uiSegmentSrv.transformToSegments(false));
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternal() {
        this.refresh(); // Asks the panel to refresh data.
    }

    onChangeNamespace() {
        this.refresh();
    }

    onChangeField() {
        this.refresh();
    }

    onChangeProject() {
        // reset namespace value in selector
        this.datasource.namespaceQuery(this.target)
            .then(() => {
                return function(results) {
                    if (results.length > 0) {
                        this.target.namespace = results[0].text;
                    }
                };
            });
        this.refresh();
    }
}

iobeamDatasourceQueryCtrl.templateUrl = "partials/query.editor.html";
