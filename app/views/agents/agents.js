'use strict';

var resv = angular.module('InmantaApp.agentsView', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'InmantaApp.agentProcDetail', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('agents', {
        url: "/agents?env",
        views: {
            "body": {
                templateUrl: "views/agents/agentBody.html",
                controller: "agentController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"

            }
        }
    });
}]);

resv.controller('agentController', ['$scope', 'inmantaService', "$stateParams", "$q", "BackhaulTable", "dialogs", function ($scope, inmantaService, $stateParams, $q, BackhaulTable, dialogs) {
    $scope.state = $stateParams;
    $scope.inmantaService = inmantaService;
    $scope.highlight = "xx";
    $scope.getEnv = function (id) {
        var out = [];
        inmantaService.getEnvironment(id).then(
            function (d) {
                out[0] = d;
            },
            function (response) {
                out[0] = { name: id, id: id, project: "" };
            });
        return out;
    };

    $scope.hl = function (id) {
        $scope.highlight = id;
    }

    $scope.getProcess = function (env, id) {
        var out = [];
        if (id) {
            inmantaService.getAgentProcess(env, id).then(
                function (d) {
                    out[0] = d;
                }
            );
        }
        return out;
    };

    $scope.envs = $q.defer();

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1,            // show first page
        count: 25,          // count per page
        filter: { expired: "!" }
    }, function (params) {
        return inmantaService.getAgentProcs().then(function (data) {
            $scope.alldata = {}
            var envs = [];

            (new Set(data.map(function (d) { return d.environment })))
                .forEach(function (item) { envs.push(item) })
            $scope.envs.resolve(envs)
            return data;
        });
    });

    if ($stateParams["env"]) {
        $scope.env = $stateParams["env"]
        inmantaService.getEnvironment($stateParams["env"]).then(function (d) { $scope.env = d.name })
        $scope.tableParams.filter()['environment'] = $stateParams["env"]

        $scope.tableParams2 = new BackhaulTable($scope, {
            page: 1,            // show first page
            count: 10          // count per page

        }, function (params) {
            return inmantaService.getAgents($stateParams["env"])
        });
    } else {
        $scope.env = null;
    }

    $scope.resources = null;
    $scope.names = function () {
        var def = $q.defer(),
            names = [],
            waiters = 0;

        $scope.envs.promise.then(function (envs) {
            angular.forEach(envs, function (id) {
                waiters = waiters + 1;
                inmantaService.getEnvironment(id)
                    .then(function (d) {
                        names.push({
                            'id': id,
                            'title': d.name
                        });
                        waiters = waiters - 1;
                        if (waiters == 0) {
                            def.resolve(names);
                        }
                    }, function (e) {
                        names.push({
                            'id': id,
                            'title': id
                        });
                        waiters = waiters - 1;
                        if (waiters == 0) {
                            def.resolve(names);
                        }
                    });
            });
        })
        return def;
    };

    $scope.details = function (proc) {
        inmantaService.getAgentprocDetais(proc.id).then(function (d) {
            dialogs.create('views/agentprocDetail/agentprocDetail.html', 'agentProcDetailCtrl', {
                data: d,
                env: $stateParams.env,
                id: proc.id,
                hostname: proc.hostname
            }, {})
        })
    }
}]);
