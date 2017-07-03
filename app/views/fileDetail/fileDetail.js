'use strict';

var rscdet = angular.module('InmantaApp.fileDetail', ['inmantaApi', 'dialogs.main']);

rscdet.controller('fileDetailCtrl', ['$scope', '$modalInstance', 'data', 'inmantaService', function ($scope, $modalInstance, data, inmantaService) {
	//-- Variables -----//
	$scope.header = "Details for " + data.resource.id;
	$scope.id = data.resource.attributes.hash;
	$scope.icon = 'glyphicon glyphicon-info-sign';
	$scope.content = "";
	inmantaService.getFile($scope.id).then(function (f) {
		$scope.content = f.content;
	});

	//-- Methods -----//
	$scope.close = function () {
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
