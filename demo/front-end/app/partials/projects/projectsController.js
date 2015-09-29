'use strict';

var prj = angular.module('ImperaApp.controllers.projects', ['imperaApi'])

prj.controller('projectsController',['$scope', 'imperaService', function ($scope, imperaService) {

  $scope.projects = [];
  $scope.currentProject = null;
  
  imperaService.getProjects().then( function(data) {
    var projects = [];
    angular.forEach(data,function(d) {this.push(d);}, projects);
    $scope.projects = projects;

    $scope.currentProject = projects[0];
  });

  $scope.status = {
    isopen: false
  };

  $scope.toggled = function(open) {
//    $log.log('Dropdown is now: ', open);
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
  
  $scope.setCurrentProject = function(project) {
    $scope.currentProject = project;
  };
}]);
