"use strict";

System.register(["./datasource", "./query_ctrl", "./constants"], function (_export, _context) {
  "use strict";

  var iobeamDatasource, iobeamDatasourceQueryCtrl, PROXY_ADDRESS, USER_TOKEN_KEY, USER_TOKEN_SUCCESS, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      iobeamDatasource = _datasource.iobeamDatasource;
    }, function (_query_ctrl) {
      iobeamDatasourceQueryCtrl = _query_ctrl.iobeamDatasourceQueryCtrl;
    }, function (_constants) {
      PROXY_ADDRESS = _constants.PROXY_ADDRESS;
      USER_TOKEN_KEY = _constants.USER_TOKEN_KEY;
      USER_TOKEN_SUCCESS = _constants.USER_TOKEN_SUCCESS;
    }],
    execute: function () {
      _export("ConfigCtrl", GenericConfigCtrl = function GenericConfigCtrl() {
        _classCallCheck(this, GenericConfigCtrl);
      });

      GenericConfigCtrl.templateUrl = "partials/config.html";

      _export("QueryOptionsCtrl", GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
        _classCallCheck(this, GenericQueryOptionsCtrl);
      });

      GenericQueryOptionsCtrl.templateUrl = "partials/query.options.html";

      _export("AnnotationsQueryCtrl", GenericAnnotationsQueryCtrl = function GenericAnnotationsQueryCtrl() {
        _classCallCheck(this, GenericAnnotationsQueryCtrl);
      });

      GenericAnnotationsQueryCtrl.templateUrl = "partials/annotations.editor.html";

      _export("Datasource", iobeamDatasource);

      _export("QueryCtrl", iobeamDatasourceQueryCtrl);

      _export("ConfigCtrl", GenericConfigCtrl);

      _export("QueryOptionsCtrl", GenericQueryOptionsCtrl);

      _export("AnnotationsQueryCtrl", GenericAnnotationsQueryCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
