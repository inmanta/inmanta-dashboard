'use strict';

var resv = angular.module('ImperaApp.controllers.projects', ['imperaApi'])

resv.controller('projectsController',['$scope','imperaService',function($scope,imperaService){

   function load(){
       imperaService.getProjectsAndEnvironments().then(function(d){$scope.projects=d})
   }
   
   load()
   $scope.$on('refresh',load)
    
   $scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams){
       if(toParams["env"]){
           setEnv(toParams["env"])
       }else{
            $scope.currentEnv = null;
            if(toParams["project"]){
                setProject(toParams["project"])
            }else{
                $scope.currentProject = null;
            }
       }
    })


   function setEnv(envid){
       imperaService.getEnvironment(envid).then(function(d){
            $scope.currentEnv = d
            setProject(d.project)})
   }

   function setProject(pid){
       imperaService.getProject(pid).then(function(d){$scope.currentProject = d})
   }

}])
