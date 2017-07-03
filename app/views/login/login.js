'use strict';

var rscdet = angular.module('InmantaApp.login', ['inmanta.services.userservice', 'dialogs.main']);

rscdet.controller('loginCtrl', ['$scope', '$modalInstance', 'userService', function ($scope, $modalInstance, userService) {
	$scope.login = function (user, pass) {
		userService.login(user, pass).then(function (d) { $modalInstance.close('closed'); });
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
}]);
