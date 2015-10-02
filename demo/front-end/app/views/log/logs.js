'use strict';



var resv = angular.module('ImperaApp.logsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('logs', {
            url: "/environment/:env/resource/:id",
            views: {
                "body": {
                    templateUrl: "views/log/logBody.html",
                    controller: "logController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});

resv.controller('logController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable","$q", function($scope, imperaService, $stateParams, BackhaulTable, $q) {
    $stateParams.id = window.decodeURIComponent($stateParams.id)
    $scope.state = $stateParams
    $scope.cmversion= $stateParams.id.substring($stateParams.id.lastIndexOf("=")+1)

    $scope.tableParams = new BackhaulTable($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'timestamp': 'desc' // initial sorting
        }
    },function(prms){
            return imperaService.getLogForResource($stateParams.env,$stateParams.id).then(function(info) {
                var data = info.logs
                $scope.resource = info.resource
                               
                return data;

            });

    });
   
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

  

     $scope.names = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "fact",
                'title': "fact"
            },{
                'id':  "user",
                'title': "user"
            },{
                'id':  "plugin",
                'title': "plugin"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.tf = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "true",
                'title': "expired"
            },{
                'id':  "false",
                'title': "not expired"
            }]
                  

            
       def.resolve(names);
       return def;
        };
}]);
