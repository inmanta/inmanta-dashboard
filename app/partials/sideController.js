'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router'])

resv.controller('sideController', ['$scope', '$rootScope', 'inmantaService', 'inmantaConfig', "$stateParams", "dialogs", function ($scope, $rootScope, inmantaService, inmantaConfig, $stateParams, dialogs) {
	$scope.state = $stateParams;
	inmantaService.getConsoleAvailable().then(function (lsm) {
		$scope.lsm = true;
	}).catch(function (rejection) {
		$scope.lsm = false;
	});
	inmantaService.getEnvironment($stateParams.env).then(function (d) {
		$scope.state.halted = d.halted;
	});
	$scope.confirmHalt = function () {
		var dlg = dialogs.confirm("Halt all operations", "Do you really want to halt all operations in environment " + $stateParams.env + "?");
		dlg.result.then(function (btn) {
			inmantaService.haltEnvironment($stateParams.env).then(function (d) { $rootScope.$broadcast('refresh'); $scope.state.halted = true; });
		});
	};
	$scope.resumeEnv = function () {
		inmantaService.resumeEnvironment($stateParams.env).then(function (d) { $rootScope.$broadcast('refresh'); $scope.state.halted = false; });
	}
}]);
