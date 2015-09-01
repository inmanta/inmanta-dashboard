'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('envs', {
            url: "/environment/:env",
            views: {
                "body": {
                    templateUrl: "views/env/envBody.html",
                    controller: "envController"
                },
                "side": {
                    templateUrl: "views/portal/portalSide.html"

                }
            }

        })
});

resv.controller('envController', ['$scope', 'imperaService', "$stateParams", "BackhaulTablePaged",function($scope, imperaService, $stateParams, BackhaulTablePaged) {

    $scope.state = $stateParams
  

    $scope.tableParams = BackhaulTablePaged($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(start,extent) {
           return imperaService.getVersionsPaged($stateParams.env, start, extent)
    }, "versions");
    
    $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
    $scope.startDryRun = function(resVersion) {
        imperaService.changeReleaseStatus($stateParams.env,resVersion,true,true).then(function(d){$scope.tableParams.reload()});
    }
    $scope.deploy = function(resVersion) {
        imperaService.changeReleaseStatus($stateParams.env,resVersion,false,true).then(function(d){$scope.tableParams.reload()});
    }


    
}]);
