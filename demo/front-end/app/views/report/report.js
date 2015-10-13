'use strict';



var resv = angular.module('ImperaApp.reportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('report', {
            url: "/environment/:env/version/:version/report?id",
            views: {
                "body": {
                    templateUrl: "views/report/reportBody.html",
                    controller: "reportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});



resv.controller('reportController', ['$scope', 'imperaService', "$stateParams","dialogs",
    function($scope, imperaService, $stateParams,dialogs) {
      

        $scope.state = $stateParams
        
        imperaService.getDryrun($stateParams.env,$stateParams.id).then(function(d) {
            $scope.dryrun=d
        });


        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d
            }, {})
       
		

        }

        $scope.dryrun = function() {
             imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
            
        }
    
    }

    
]);
