'use strict';

var rscdet = angular.module('InmantaApp.agentProcDetail', ['inmantaApi','dialogs.main'])

rscdet.controller('agentProcDetailCtrl',['$scope','$modalInstance','data',"dialogs",function($scope,$modalInstance,data,dialogs){
	//-- Variables -----//

	$scope.header = "Details for " + data.id ;
    $scope.env=data.env
    $scope.data = data.data
    $scope.id = data.id

	$scope.icon = 'glyphicon glyphicon-info-sign';

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close

}]); // end WaitDialogCtrl
