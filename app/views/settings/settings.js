'use strict';

var resv = angular.module('InmantaApp.settings', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('settings', {
        url: "/settings/:env",
        views: {
            "body": {
                templateUrl: "views/settings/settings.html",
                controller: "settingsController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('settingsController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTable", "dialogs", "authService",
        function ($scope, $rootScope, inmantaService, $stateParams, BackhaulTable, dialogs, authService) {
    $scope.state = $stateParams;
    $scope.auth = authService;

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1, // show first page
        count: 10 // count per page
    }, function (params) {
        return inmantaService.getSettings($stateParams.env).then(function (data) {
            var rows = [];
            var row;
            var x = 0;
            for (x in data.metadata) {
                row = {"key": x, "help": data.metadata[x].doc,
                        "type": data.metadata[x].type, "default": data.metadata[x].default};
                if (data.settings[x] === undefined) {
                    row.value = null;
                } else {
                    row.value = data.settings[x];
                }
                rows.push(row);
            }
            return rows;
        });
    });

    $scope.edit = function (env_id, setting) {
        dialogs.create('views/settings/settingEdit.html', 'settingsEditCtrl', {
            setting: setting,
            env: env_id
        }, {});
    };

    $scope.delete = function (env_id, setting) {
        inmantaService.deleteSetting(env_id, setting.key).then(function (f) {
            $rootScope.$broadcast('refresh');
        });
    };

    $scope.generate = function (env_id, token) {
        var client_types = [];
        if (token && token.api) {
            client_types.push("api");
        }
        if (token && token.compiler) {
            client_types.push("compiler");
        }
        if (token && token.agent) {
            client_types.push("agent");
        }

        if (client_types.length == 0) {
            $scope.generated_token = "";
        } else {
            inmantaService.createToken(env_id, client_types).then(function (result) {
                $scope.generated_token = result["token"];
            });
        }
    };
}]);

resv.controller('settingsEditCtrl', ['$scope', '$rootScope', 'inmantaService', '$modalInstance', 'data', 'dialogs',
        function ($scope, $rootScope, inmantaService, $modalInstance, data, dialogs) {
    //-- Variables -----//
    $scope.env = data.env;

    if (data.setting.value === null) {
        data.setting.value = data.setting.default;
        data.setting.is_default = true;
    } else {
        data.setting.is_default = false;
    }
    $scope.setting = data.setting;
    $scope.icon = 'glyphicon glyphicon-pencil';

    var save = function (env_id, setting) {
        return inmantaService.setSetting(env_id, setting.key, setting.value);
    };

    $scope.submit = function () {
        save($scope.env, $scope.setting).then(function (f) {
            $rootScope.$broadcast('refresh');
            $modalInstance.close(f);
            $scope.$destroy();
        });
    };

    $scope.close = function () {
        $modalInstance.close();
        $scope.$destroy();
    };
}]);