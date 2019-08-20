'use strict';

var resv = angular.module('InmantaApp.status', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('status', {
        url: "/serverstatus",
        views: {
            "body": {
                templateUrl: "views/status/status.html",
                controller: "statusController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('statusController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "inmantaConfig",
        function ($scope, $rootScope, inmantaService, $stateParams, inmantaConfig) {

    inmantaService.get_server_status().then(function(response) {
            $scope.status = response;
        }
    );

    $scope.config = inmantaConfig
}]);