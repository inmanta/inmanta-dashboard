'use strict';

var resv = angular.module('ImperaApp.controllers.side', ['ui.router'])

resv.controller('sideController',['$scope', '$rootScope', 'imperaService', "$stateParams",function($scope, $rootScope, imperaService, $stateParams) {
	$scope.state= $stateParams
	
	
}])
