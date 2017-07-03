'use strict';

var resv = angular.module('InmantaApp.controllers.projects', ['inmantaApi'])

resv.controller('projectsController',['$scope','inmantaService',function($scope,inmantaService){

   function load(){
       inmantaService.getProjectsAndEnvironments().then(function(d){$scope.projects=d})
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
       inmantaService.getEnvironment(envid).then(function(d){
            $scope.currentEnv = d
            setProject(d.project)})
   }

   function setProject(pid){
       inmantaService.getProject(pid).then(function(d){$scope.currentProject = d})
   }

}])
