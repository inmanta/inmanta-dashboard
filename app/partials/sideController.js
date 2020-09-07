'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router', 'inmantaApi', 'dialogs.main'])

resv.controller('sideController', ['$scope', '$rootScope', 'inmantaService', 'inmantaConfig', "$stateParams", "dialogs", function ($scope, $rootScope, inmantaService, inmantaConfig, $stateParams, dialogs) {
	$scope.state = $stateParams;
	inmantaService.getConsoleAvailable().then(function (lsm) {
		$scope.lsm = true;
	}).catch(function (rejection) {
		$scope.lsm = false;
	});
	if ($stateParams.env) {
		inmantaService.getEnvironment($stateParams.env).then(function (d) {
			$rootScope.halted = d.halted;
		});
	}
	$scope.confirmHalt = function () {
		var dlg = dialogs.confirm("Emergency stop", "Are you sure you want to initiate an emergency stop and halt all operations in environment " + $stateParams.env + "?");
		dlg.result.then(function (btn) {
			inmantaService.haltEnvironment($stateParams.env).then(function (d) {
				$rootScope.halted = true;
				$rootScope.$broadcast('refresh');
			});
		});
	};
	$scope.confirmResume = function () {
		var dlg = dialogs.confirm("Resume all operations", "Are you sure you want to resume all operations in environment " + $stateParams.env + "?");
		dlg.result.then(function (btn) {
			inmantaService.resumeEnvironment($stateParams.env).then(function (d) {
				$rootScope.halted = false;
				$rootScope.$broadcast('refresh');
			});
		});
	}
}]);
