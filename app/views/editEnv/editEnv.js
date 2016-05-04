'use strict';

var resv = angular.module('ImperaApp.editEnv', ['ui.router','imperaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('editEnv', {
      url: "/editEnvironment/:env",
      views:{
        "body":{
            templateUrl: "views/editEnv/editEnv.html",
            controller:"editEnvController"
        },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "envController"

                }
      }
      
    })
}]);

resv.controller('editEnvController', ['$scope', 'imperaService', '$stateParams', '$state', function($scope, imperaService, $stateParams, $state) {
 
    $scope.state = $stateParams
 
    
    
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
        imperaService.getProject(d.project).then(function(p){
            $scope.selectedProject = p;
        })
        $scope.name = d.name
        $scope.selectedTag = d.repo_branch
        $scope.repo = d.repo_url
    });

    $scope.editEnv = function(projectid, env_name, repo_url, branch) {
        $scope.env.name = env_name;
        $scope.env.repo_branch = branch;
        $scope.env.repo_url = repo_url
        imperaService.editEnvironment($scope.env).then(function(d){$state.go("envs",{ env:d.id })});
    }
}]);
