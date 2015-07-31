'use strict';

// Declare app level module which depends on views, and components
angular.module('ImperaApp', [
  'ngRoute',
  'ui.bootstrap',
  'imperaControl'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
