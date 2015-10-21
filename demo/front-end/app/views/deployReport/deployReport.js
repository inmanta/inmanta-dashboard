'use strict';



var resv = angular.module('ImperaApp.deployReportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('deployReport', {
            url: "/environment/:env/version/:version/deploy",
            views: {
                "body": {
                    templateUrl: "views/deployReport/reportBody.html",
                    controller: "deployReportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});



resv.controller('deployReportController', ['$scope', 'imperaService', "$stateParams","dialogs","BackhaulTable","$q","$rootScope",
    function($scope, imperaService, $stateParams,dialogs,BackhaulTable, $q, $rootScope) {
        

        $scope.state = $stateParams
        
        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page,
        }, function(params){
                  
            return imperaService.getDeployReport($stateParams.env,$stateParams.version).then(function(d) {
                $scope.data = d;
                return d.resources;
            });
           

        });
        
      
        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d
            }, {})
       
		

        }
    
    }

    
]);
