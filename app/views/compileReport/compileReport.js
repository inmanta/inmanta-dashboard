'use strict';

var resv = angular.module('InmantaApp.compileReport', ['ui.router', 'inmantaApi']);

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider.state('compileReport', {
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
    });
}]);

resv.controller('compileReportController', ['$scope', 'inmantaService', "$stateParams", function ($scope, inmantaService, $stateParams) {
    $scope.state = $stateParams;
    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    function load() {
        inmantaService.getCompileReports($stateParams.env).then(function (d) {
            $scope.compiles = d;
            if (!$scope.compile) {
                $scope.compile = d[0];
                $scope.load_report();
            }
        });
    }

    $scope.load_report = function () {
        inmantaService.getReport($scope.compile.id).then(function (d) {
            d.reports.forEach(function (f) {
                f.open = f.errstream.length !== 0;
            });

            d.reports.forEach(function (f) {
                if (f.open === undefined) {
                    f.open = f.returncode !== 0;
                }
            });
            $scope.current_report = d;
        });
    };
    load();
    $scope.$on('refresh', load);
}]);