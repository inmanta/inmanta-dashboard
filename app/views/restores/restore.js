'use strict';

var resv = angular.module('ImperaApp.restoreView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('restores', {
            url: "/environment/:env/restore",
            views: {
                "body": {
                    templateUrl: "views/restores/restoreBody.html",
                    controller: "restoreController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});

resv.controller('restoreController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10,
            sorting: {
                'started': 'desc' // initial sorting
            }
        }, function(params){
                    return  imperaService.getRestores($stateParams.env)
        });
        
      
    }

    
]);
