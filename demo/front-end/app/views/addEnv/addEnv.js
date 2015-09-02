'use strict';

var resv = angular.module('ImperaApp.addEnv', ['ui.router','imperaApi','ngTable'])

resv.config(function($stateProvider) {
 $stateProvider
    .state('addEnv', {
      url: "/addEnvironment",
      views:{
        "body":{
            templateUrl: "views/addEnv/addEnv.html",
            controller:"addEnvController"
        },
        "side":{
            templateUrl: "views/portal/portalSide.html"
          
        }
      }
      
    })
});

resv.controller('addEnvController', ['$scope', 'imperaService', '$state', function($scope, imperaService, $state) {
 
    $scope.name = null;

    $scope.selectedTag = null;

    $scope.ready = function(){
        return $scope.selectedProject;
    }
    imperaService.getProjects().then(function(data) {
        $scope.projects = data;
       
    });

    $scope.addEnv = function(project,name,repo,tag){
        //console.log(project,name,repo,tag)
        imperaService.addEnvironment(project,name,repo,tag).then(function(d){$state.go("envs",{ env:d.id })})
    }

    
    $scope.projects = null
  
}]);
