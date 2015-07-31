'use strict';

// Declare app level module which depends on views, and components
angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ImperaApp.portalView'
]).config(function($urlRouterProvider) {
 $urlRouterProvider.otherwise("/portal");   
})
