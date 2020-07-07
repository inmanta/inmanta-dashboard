'use strict';

var resv = angular.module('InmantaApp.parametersView', ['ui.router', 'inmantaApi', 'ngTable']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('params', {
        url: "/parameters/:env",
        views: {
            "body": {
                templateUrl: "views/parameters/parametersBody.html",
                controller: "paramsController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"

            }
        }

    });
}]);

resv.controller('paramsController', ['$scope', 'inmantaService', "$stateParams", "BackhaulTable", "dialogs", "$q",
        function ($scope, inmantaService, $stateParams, BackhaulTable, dialogs, $q) {
    $scope.state = $stateParams;

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function (params) {
        return inmantaService.getParameters($stateParams.env).then(function (info) {
            var data = info.parameters;
            $scope.expire = info.expire;
            var timeInMs = Date.now();
            $scope.servertime = info.now;
            $scope.drift = info.now - timeInMs;

            data.forEach(function (d) {
                if (d.source === 'fact') {
                    d.expired = d.updated.getTime() + ($scope.expire * 1000) < $scope.servertime.getTime();
                } else {
                    d.expired = false;
                }
            });
            return data;
        });
    });

    $scope.resources = null;
    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    $scope.getRecord = function (param) {
        return {
            'in': param,
            'show': false,
            'value': ''
        };
    };

    $scope.getValue = function (param) {
        inmantaService.getParameter($scope.state.env, param.in.name, param.in.resource_id).then(function (d) {
            param.out = d;
            param.value = d.value;
            param.show = true;
        });
    };

    $scope.names = function () {
        var def = $q.defer();
        var names = [
            {
                'id': "fact",
                'title': "fact"
            }, {
                'id': "user",
                'title': "user"
            }, {
                'id': "plugin",
                'title': "plugin"
            }, {
                'id': "report",
                'title': "report"
            }
        ];
        def.resolve(names);
        return def;
    };

    $scope.tf = function () {
        var def = $q.defer();
        var names = [
            {
                'id': "true",
                'title': "expired"
            }, {
                'id': "false",
                'title': "not expired"
            }
        ];

        def.resolve(names);
        return def;
    };

    $scope.details = function (param) {
        dialogs.create('views/parameters/details.html', 'detailsController', {
            param: param
        }, {});
    };

    $scope.remove = function (param) {
        console.log(param);
        inmantaService.deleteParameter($scope.state.env, param.name, param.resource_id).then(function (d) {
        });
    };
}]);

resv.controller('detailsController', ['$scope', '$modalInstance', 'data', 'inmantaService', function ($scope, $modalInstance, data, inmantaService) {
    //-- Variables -----//
    $scope.header = "Details for " + data.param.name;
    $scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.param = data.param;

    //-- Methods -----//
    $scope.close = function () {
        $modalInstance.close();
        $scope.$destroy();
    }; // end close
}]); // end WaitDialogCtrl
