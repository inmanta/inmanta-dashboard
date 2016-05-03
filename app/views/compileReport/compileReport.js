'use strict';



var resv = angular.module('ImperaApp.compileReport', ['ui.router', 'imperaApi'])

resv.config(["$stateProvider", function($stateProvider) {
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
}]);



resv.controller('compileReportController', ['$scope', 'imperaService', "$stateParams",
    function($scope, imperaService, $stateParams) {
        
        $scope.state = $stateParams
        
        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });
        
        function load(){
            imperaService.getCompileReports($stateParams.env).then(function(d) {
                $scope.compiles = d
                //d.forEach(function(d){d.reports.forEach(function(f){f.open=f.errstream.length != 0})})
                d.forEach(function(d){d.reports.forEach(function(f){
                    if(!('open' in f)){
                        f.open=(f.returncode!=0)
                    }
                })})
                if(!$scope.compile){
                    $scope.compile=d[0]
                }
            });
        }
        
        load();
        
        $scope.$on('refresh',load)

        
    }

    
]);
