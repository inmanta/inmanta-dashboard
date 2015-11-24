'use strict';

var resv = angular.module('ImperaApp.snapshotDetailView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('snapshot', {
            url: "/environment/:env/snapshot/:id",
            views: {
                "body": {
                    templateUrl: "views/snapshotDetail/snapshotDetailBody.html",
                    controller: "snapshotDetailController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});

resv.controller('snapshotDetailController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10
        }, function(params){
                    return imperaService.getSnapshot($stateParams.env,$stateParams.id).then(function (sn){
                        $scope.sn = sn
                        return sn.resources
                    })
        });
        
      
       $scope.download = function(hash){
            imperaService.downloadFile(hash);
       }
    }

    
]);
