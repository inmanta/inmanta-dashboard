'use strict';

var resv = angular.module('ImperaApp.addProject', ['ui.router','imperaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('addProject', {
      url: "/addProject",
      views:{
        "body":{
            templateUrl: "views/addProject/addProject.html",
            controller:"addProjectController"
        },
        "side":{
            templateUrl: "partials/emptysidebar.html"
          
        }
      }
      
    })
}]);

resv.controller('addProjectController', ['$scope', 'imperaService', '$state', function($scope, imperaService, $state) {
 
    $scope.name = null;

   
    $scope.ready = function(){
        return $scope.selectedProject;
    }
    imperaService.getProjects().then(function(data) {
        $scope.projects = data;
        
    });

    $scope.addProject = function(name){
        //console.log(project,name,repo,tag)
        imperaService.addProject(name).then(function(d){$state.go("addEnv",{project:d.id})})
    }

    
    $scope.projects = null
  
}]);
