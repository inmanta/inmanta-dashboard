'use strict';

var rscdet = angular.module('InmantaApp.inputDialog', ['inmantaApi','dialogs.main'])

rscdet.controller('inputDialogCtrl',['$scope','$modalInstance','data','inmantaService',function($scope,$modalInstance,data,inmantaService){
	//-- Variables -----//

	$scope.header = data.header ;
   	$scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.content= data.content
	
	$scope.close = function(){
		$modalInstance.close($scope.result);
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
