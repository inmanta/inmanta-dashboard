'use strict';

var resv = angular.module('InmantaApp.addEnv', ['ui.router','inmantaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('addEnv', {
      url: "/addEnvironment?project",
      views:{
        "body":{
            templateUrl: "views/addEnv/addEnv.html",
            controller:"addEnvController"
        },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
      }
      
    })
}]);

resv.controller('addEnvController', ['$scope', 'inmantaService', '$state','$stateParams','$rootScope', function($scope, inmantaService, $state,$stateParams,$rootScope) {
 
    $scope.name = null;

    $scope.selectedTag = null;

    $scope.ready = function(){
        return $scope.selectedProject;
    }
    inmantaService.getProjects().then(function(data) {
        $scope.projects = data;
        if($stateParams["project"]){
            
            $scope.selectedProject = data.filter(function(d){return d.id == $stateParams["project"]})[0]
        }       
    });

    
    $scope.addEnv = function(project,name,repo,tag){
        //console.log(project,name,repo,tag)
        inmantaService.addEnvironment(project,name,repo,tag).then(function(d){$rootScope.$broadcast('refresh'); $state.go("envs",{ env:d.id })})
    }

    
    $scope.projects = null
  
}]);
