"use strict";

System.register([], function (_export, _context) {
  "use strict";

  var DEFAULT_SELECT_FIELD, DEFAULT_SELECT_NS, DEFAULT_SELECT_PROJECT, DEFAULT_DEVICE, DEFAULT_WHERE, NONE, DEFAULT_GROUP_BY_OP, ALL_DEVICES, LAST_PROJECT_TOKEN, STANDALONE, ALL_OPERATORS, PROXY_ADDRESS, SELF_ADDRESS, USER_TOKEN_KEY, USER_TOKEN_SUCCESS;
  return {
    setters: [],
    execute: function () {
      _export("DEFAULT_SELECT_FIELD", DEFAULT_SELECT_FIELD = "-- select field --");

      _export("DEFAULT_SELECT_FIELD", DEFAULT_SELECT_FIELD);

      _export("DEFAULT_SELECT_NS", DEFAULT_SELECT_NS = "-- select namespace --");

      _export("DEFAULT_SELECT_NS", DEFAULT_SELECT_NS);

      _export("DEFAULT_SELECT_PROJECT", DEFAULT_SELECT_PROJECT = "-- select project --");

      _export("DEFAULT_SELECT_PROJECT", DEFAULT_SELECT_PROJECT);

      _export("DEFAULT_DEVICE", DEFAULT_DEVICE = "-- select device --");

      _export("DEFAULT_DEVICE", DEFAULT_DEVICE);

      _export("DEFAULT_WHERE", DEFAULT_WHERE = "-- where clause --");

      _export("DEFAULT_WHERE", DEFAULT_WHERE);

      _export("NONE", NONE = "-- none --");

      _export("NONE", NONE);

      _export("DEFAULT_GROUP_BY_OP", DEFAULT_GROUP_BY_OP = "mean");

      _export("DEFAULT_GROUP_BY_OP", DEFAULT_GROUP_BY_OP);

      _export("ALL_DEVICES", ALL_DEVICES = "[ all ]");

      _export("ALL_DEVICES", ALL_DEVICES);

      _export("LAST_PROJECT_TOKEN", LAST_PROJECT_TOKEN = "Last project token");

      _export("LAST_PROJECT_TOKEN", LAST_PROJECT_TOKEN);

      _export("STANDALONE", STANDALONE = false);

      _export("STANDALONE", STANDALONE);

      _export("ALL_OPERATORS", ALL_OPERATORS = ["mean", "max", "min", "count", "sum"]);

      _export("ALL_OPERATORS", ALL_OPERATORS);

      _export("PROXY_ADDRESS", PROXY_ADDRESS = "http://localhost:7080");

      _export("PROXY_ADDRESS", PROXY_ADDRESS);

      _export("SELF_ADDRESS", SELF_ADDRESS = "http://localhost:3000");

      _export("SELF_ADDRESS", SELF_ADDRESS);

      _export("USER_TOKEN_KEY", USER_TOKEN_KEY = "user token");

      _export("USER_TOKEN_KEY", USER_TOKEN_KEY);

      _export("USER_TOKEN_SUCCESS", USER_TOKEN_SUCCESS = "user token stored");

      _export("USER_TOKEN_SUCCESS", USER_TOKEN_SUCCESS);
    }
  };
});
//# sourceMappingURL=constants.js.map
