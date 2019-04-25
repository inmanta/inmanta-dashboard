'use strict';

var resv = angular.module('InmantaApp.envView', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('envs', {
        url: "/environment/:env",
        views: {
            "body": {
                templateUrl: "views/env/envBody.html",
                controller: "envController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('envFunctionController', ['$scope', '$rootScope', 'inmantaService', '$stateParams', '$state', 'dialogs', function ($scope, $rootScope, inmantaService, $stateParams, $state, dialogs) {
    $scope.state = $stateParams;
    $scope.inmantaService = inmantaService;

    $scope.compile = function (env) {
        inmantaService.compile(env).then(function () {
            $scope.cstate = true;
            $rootScope.$broadcast('refresh');
        });
    };

    $scope.decommission = function (env) {
        var dlg = dialogs.confirm("Confirm delete", "Do you really want to decomission the environment " + env.name + " this can NOT BE UNDONE! ");
        dlg.result.then(function (btn) {
            inmantaService.decommission(env).then(
                function (d) {
                    $rootScope.$broadcast('refresh');
                });
        });
    };

    $scope.clearEnv = function (env) {
        var dlg = dialogs.confirm("Confirm clear", "Do you really want to clear the entire environment " + env.name + " this can NOT BE UNDONE! ");
        dlg.result.then(function (btn) {
            inmantaService.clearEnv(env).then(
                function (d) {
                    $rootScope.$broadcast('refresh');
                });
        });
    };

    $scope.clone = function (env) {
        dialogs.create('partials/input/inputDialog.html', 'inputDialogCtrl', {
            header: "Clone name",
            content: "Name for the clone"
        }, {}).result.then(function (name) {
            inmantaService.clone(env, name).then(
                function (d) {
                    $rootScope.$broadcast('refresh');
                    $state.go("envs", { env: d.id });
                });
        });
    };

    $scope.updateCompile = function (env) {
        inmantaService.updateCompile(env).then(function () {
            $scope.cstate = true;
            $rootScope.$broadcast('refresh');
        });
    };

    var getCompileState = function () {
        if ($scope.state.env) {
            inmantaService.isCompiling($scope.state.env).then(function (data) { $scope.cstate = data; });
        }
    };

    getCompileState();
    $scope.$on("refresh", getCompileState);
}]);

resv.controller('envController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTablePaged", 'dialogs', function ($scope, $rootScope, inmantaService, $stateParams, BackhaulTablePaged, dialogs) {
    $scope.state = $stateParams;

    $scope.resources = null;
    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    $scope.startDryRun = function (res) {
        var resVersion = res.version;
        inmantaService.dryrun($stateParams.env, resVersion).then(function (d) {
            $rootScope.$broadcast('refresh');
        });
    };

    $scope.deploy = function (res) {
        var resVersion = res.version;
        inmantaService.deploy($stateParams.env, resVersion, true).then(function (d) { $rootScope.$broadcast('refresh'); });
    };


    $scope.deleteVersion = function (res) {
        var resVersion = res.version;
        var dlg = dialogs.confirm("Confirm delete", "Do you really want to delete the version " + resVersion);
        dlg.result.then(function (btn) {
            inmantaService.deleteVersion($stateParams.env, resVersion).then(function (d) { $rootScope.$broadcast('refresh'); });
        });
    };

    var getState = function (res) {
        if (!res.released) {
            return "new";
        }
        if (res.deployed) {
            return "deployed";
        }
        return res.result;
    };

    var getTrigger = function (res) {
        if (res.version_info.export_metadata && res.version_info.export_metadata.type) {
            return {"type": res.version_info.export_metadata.type, "message": res.version_info.export_metadata.message}
        }
        return null;
    };

    $scope.tableParams = new BackhaulTablePaged($scope, {
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function (start, extent) {
        return inmantaService.getVersionsPaged($stateParams.env, start, extent).then(
            function (d) {
                d.versions.forEach(function (d) {
                    d.state = getState(d);
                    d.trigger = getTrigger(d);
                });
                return d;
            });
    }, "versions");
}]);
