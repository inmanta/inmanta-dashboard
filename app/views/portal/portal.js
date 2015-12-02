'use strict';

var module = angular.module('ImperaApp.portalView', ['ui.router', 'imperaApi'])

module.config(function($stateProvider) {
    $stateProvider
        .state('portal', {
            url: "/environment/:env/portal",
            views: {
                "body": {
                    templateUrl: "views/portal/portalBody.html",
                    controller: "PortalController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html"
                }
            }

        })
});

module.controller('PortalController', ['$scope','$rootScope', 'imperaService', '$stateParams',function($scope,$rootScope, imperaService, $stateParams) {
    $scope.state = $stateParams
    
    imperaService.getReportParameters($stateParams.env).then(function(d) {
        $scope.report = d
    });
}])
