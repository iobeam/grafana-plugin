import {iobeamDatasource} from "./datasource";
import {iobeamDatasourceQueryCtrl} from "./query_ctrl";
import {PROXY_ADDRESS, USER_TOKEN_KEY, USER_TOKEN_SUCCESS} from "./constants";

class GenericConfigCtrl {}
GenericConfigCtrl.templateUrl = "partials/config.html";

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = "partials/query.options.html";

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = "partials/annotations.editor.html";

export {
  iobeamDatasource as Datasource,
  iobeamDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
