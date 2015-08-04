'use strict';

// Declare app level module which depends on views, and components
angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'ImperaApp.portalView',
  'ImperaApp.resourceView',
  'ImperaApp.envView'
]).config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/portal");   
})
