'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router'])

resv.controller('sideController', ['$scope', '$rootScope', 'inmantaService', 'inmantaConfig', "$stateParams", function ($scope, $rootScope, inmantaService, inmantaConfig, $stateParams) {
	$scope.state = $stateParams;
	inmantaService.getConsoleAvailable().then(function(lsm) {
		$scope.lsm = true;
	}).catch(function(rejection) { 
		$scope.lsm = false;
	});
}]);
