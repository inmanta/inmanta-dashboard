'use strict';



var resv = angular.module('ImperaApp.compileReport', ['ui.router', 'imperaApi'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('compileReport', {
            url: "/environment/:env/compilereport",
            views: {
                "body": {
                    templateUrl: "views/compileReport/compileBody.html",
                    controller: "compileReportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});



resv.controller('compileReportController', ['$scope','$rootScope', 'imperaService', "$stateParams",
    function($scope, $rootScope, imperaService, $stateParams) {
        
        $scope.state = $stateParams
        
        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        imperaService.getCompileReports($stateParams.env).then(function(d) {
            $scope.compiles = d
            //d.forEach(function(d){d.reports.forEach(function(f){f.open=f.errstream.length != 0})})
            d.forEach(function(d){d.reports.forEach(function(f){f.open=false})})
            $scope.compile=d[0]
        });

        
    }

    
]);
