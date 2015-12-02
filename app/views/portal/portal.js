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
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"
                }
            }

        })
});

module.controller('PortalController', ['$scope','$rootScope', 'imperaService', '$stateParams',function($scope,$rootScope, imperaService, $stateParams) {
    $scope.state = $stateParams
    
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
    imperaService.getReportParameters($stateParams.env).then(function(d) {
        $scope.report = d
    });
    
      
    var alertForUnknown = function(){
   
        imperaService.getUnkownsForEnv($stateParams.env).then(function(unknowns){
            var unknowns = unknowns.filter(function(unknown){return unknown.source=='form'})
            var out = {}
            unknowns.forEach(function (unknown){out[unknown.metadata.form]=unknown})
            $scope.unknowns = Object.keys(out).map(function(key){
                return out[key]
            })
        })
    
    }  
  
    $scope.$on('refresh',alertForUnknown)
    alertForUnknown()
}])
