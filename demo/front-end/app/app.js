'use strict';

// Declare app level module which depends on views, and components
angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'hljs',
  'ImperaApp.portalView',
  'ImperaApp.resourceView',
  'ImperaApp.envView',
  'ImperaApp.addEnv',
  'ImperaApp.addProject',
  'ImperaApp.graphView',
  'imperaApi.config',
  'ImperaApp.agentsView',
  'ImperaApp.prametersView'
]).config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/portal");   
}).controller("configCtrl",["$scope","imperaConfig",function($scope,imperaConfig){
  $scope.config=imperaConfig
}])
