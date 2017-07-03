'use strict';

var resv = angular.module('InmantaApp.snapshotDetailView', ['ui.router', 'inmantaApi', 'ngTable','inmanta.services.backhaul','InmantaApp.inputDialog'])

resv.config(["$stateProvider", function($stateProvider) {
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
}]);

resv.controller('snapshotDetailController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, inmantaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10
        }, function(params){
                    return inmantaService.getSnapshot($stateParams.env,$stateParams.id).then(function (sn){
                        $scope.sn = sn
                        return sn.resources
                    })
        });
        
      
       $scope.download = function(hash){
            inmantaService.downloadFile(hash);
       }
    }

    
]);
