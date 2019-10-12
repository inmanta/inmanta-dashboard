'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router'])

resv.controller('sideController', ['$scope', '$rootScope', 'inmantaService', 'inmantaConfig', "$stateParams", function ($scope, $rootScope, inmantaService, inmantaConfig, $stateParams) {
	$scope.state = $stateParams;
	$scope.lsm = inmantaConfig.lcm;
}]);
