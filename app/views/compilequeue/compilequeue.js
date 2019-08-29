'use strict';

var resv = angular.module('InmantaApp.compilequeue', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('compilequeue', {
        url: "/compilequeue/:env",
        views: {
            "body": {
                templateUrl: "views/compilequeue/compilequeue.html",
                controller: "compilequeueController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('compilequeueController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTable", "dialogs", "authService",
        function ($scope, $rootScope, inmantaService, $stateParams, BackhaulTable, dialogs, authService) {
    $scope.state = $stateParams;
    $scope.auth = authService;

    $scope.tableParams = new BackhaulTable($scope, {
    }, function (params) {
        return inmantaService.getCompileQueue($stateParams.env).then(function (data) {
            return data.queue;
        });
    });

}]);