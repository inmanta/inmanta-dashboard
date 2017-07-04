'use strict';

var resv = angular.module('InmantaApp.editEnv', ['ui.router', 'inmantaApi', 'ngTable']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('editEnv', {
        url: "/editEnvironment/:env",
        views: {
            "body": {
                templateUrl: "views/editEnv/editEnv.html",
                controller: "editEnvController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "envController"
            }
        }
    });
}]);

resv.controller('editEnvController', ['$scope', 'inmantaService', '$stateParams', '$state', function ($scope, inmantaService, $stateParams, $state) {
    $scope.state = $stateParams;

    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
        inmantaService.getProject(d.project).then(function (p) {
            $scope.selectedProject = p;
        });
        $scope.name = d.name;
        $scope.selectedTag = d.repo_branch;
        $scope.repo = d.repo_url;
    });

    $scope.editEnv = function (projectid, env_name, repo_url, branch) {
        $scope.env.name = env_name;
        $scope.env.repo_branch = branch;
        $scope.env.repo_url = repo_url;
        inmantaService.editEnvironment($scope.env).then(function (d) { $state.go("envs", { env: d.id }); });
    };
}]);
