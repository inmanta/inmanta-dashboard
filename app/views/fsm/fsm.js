'use strict';

var resv = angular.module('InmantaApp.fsm', ['ui.router', 'inmantaApi', 'ngTable']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('fsm', {
        url: "/fsm/:env",
        views: {
            "body": {
                templateUrl: "views/fsm/fsm.html",
                controller: "fsmController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('fsmController', ['$scope', 'inmantaService', "$stateParams", "$q",
        function ($scope, inmantaService, $stateParams, $q) {
    $scope.state = $stateParams;

    var getFSM = function () {
        inmantaService.getParameters($stateParams.env, {'query': {'module': 'state'}}).then(function (info) {
            var data = [];
            info.parameters.forEach(function (item) {
                var transfers = {};
                item.metadata.transfer.forEach(function (x) {
                    if (!(x.from in transfers)) {
                        transfers[x.from] = [];
                    }
                    transfers[x.from].push(x.to);
                });
                item.transfers = transfers;
                data.push(item);
            });
            $scope.fsm = data;
        });
    }

    $scope.$on('refresh', getFSM);
    getFSM();
}]);
