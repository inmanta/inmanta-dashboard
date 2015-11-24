'use strict';

var rscdet = angular.module('ImperaApp.inputDialog', ['imperaApi','dialogs.main'])

rscdet.controller('inputDialogCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//

	$scope.header = data.header ;
   	$scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.content= data.content
	
	$scope.close = function(){
		$modalInstance.close($scope.result);
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
