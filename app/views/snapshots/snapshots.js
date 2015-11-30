'use strict';

var resv = angular.module('ImperaApp.snapshotView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('snapshots', {
            url: "/environment/:env/snapshot",
            views: {
                "body": {
                    templateUrl: "views/snapshots/snapshotBody.html",
                    controller: "snapshotController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});

resv.controller('snapshotController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10,
            sorting: {
                'started': 'desc' // initial sorting
            }
        }, function(params){
                    return  imperaService.getSnapshots($stateParams.env)
        });
        
       $scope.deleteSnapshot = function(id){
                 imperaService.deleteSnapshot($stateParams.env,id).then( function(){$rootScope.$broadcast('refresh');});
       }

       $scope.restoreSnapshot =  function(env, id){
                 imperaService.restoreSnapshot(env,id)
       }

       $scope.createSnapshot = function(id){
                // 
            dialogs.create('partials/input/inputDialog.html', 'inputDialogCtrl', {
                header: "Snapshot name",
                content:"Name for the snapshot"
            }, {}).result.then(function(name){
                imperaService.createSnapshot($stateParams.env,name).then( function(){$rootScope.$broadcast('refresh');});
            })
       }
    }

    
]);
