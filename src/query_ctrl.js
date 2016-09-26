import _ from "lodash";
import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'
import {
    DEFAULT_DEVICE,
    DEFAULT_GROUP_BY,
    DEFAULT_GROUP_BY_OP,
    DEFAULT_SELECT_FIELD,
    DEFAULT_SELECT_NS,
    DEFAULT_WHERE
} from "./constants";

export class GenericDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector, uiSegmentSrv)  {
        super($scope, $injector);

        this.scope = $scope;
        this.uiSegmentSrv = uiSegmentSrv;
        this.target.target = this.target.target || DEFAULT_SELECT_FIELD;
        this.target.namespace = this.target.namespace || DEFAULT_SELECT_NS;
        this.target.device_id = this.target.device_id || DEFAULT_DEVICE;
        this.target.group_by_field = this.target.group_by_field || DEFAULT_GROUP_BY;
        this.target.group_by_operator = this.target.group_by_operator || DEFAULT_GROUP_BY_OP;
        this.target.interval = this.target.interval || this.panelCtrl.interval;

        this.wheres = this.wheres || [[this.uiSegmentSrv.newPlusButton()]];
        this.target.wheres = this.wheres;
    }

    addWhereRow(rowIdx) {
        const field = this.uiSegmentSrv.newSegment(DEFAULT_WHERE);
        field.cssClass = "io-segment io-where-clause";
        const del = this.uiSegmentSrv.newSegment("");
        del.html = "<i class=\"fa fa-trash\"></i>";
        del.type = "delete";
        del.cssClass = "io-segment";
        const button = this.uiSegmentSrv.newPlusButton();
        button.cssClass = "io-segment-no-left";

        this.wheres[rowIdx] = [field, del];
        this.wheres.push([button]);
    }

    wheresClicked(segment, rowIdx, idx) {
        if (segment.type === "plus-button") {
            if (rowIdx === 0 || this.wheres[rowIdx - 1][0].value !== DEFAULT_WHERE) {
                this.addWhereRow(rowIdx);
            } else {
                this.wheres[rowIdx][idx] = this.uiSegmentSrv.newPlusButton();
            }
        } else if (segment.type === "delete") {
            this.wheres.splice(rowIdx, 1);
        }
        return this.datasource.q.reject();
    }

    wheresUpdated(segment, rowIdx, idx) {
        this.panelCtrl.refresh();
    }

    intervalClicked() {
        return new Promise(() => {});
    }

    getOptions() {
        return this.datasource.fieldQuery(this.target)
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
        const operators = ["mean", "max", "min", "sum", "count"];
        return new Promise((resolve, reject) => {
            resolve(_.map(operators, (v) => {
                return {text: v, value: v};
            }));
        }).then(this.uiSegmentSrv.transformToSegments(false));
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternal() {
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
