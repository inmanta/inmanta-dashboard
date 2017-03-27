'use strict';

var rscdet = angular.module('ImperaApp.diffDetail', ['imperaApi','dialogs.main'])

rscdet.controller('diffDetailCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//
    $scope.content=""
    $scope.header=data.id
    imperaService.getDiff(data.diff.current,data.diff.desired).then(function(f){
        $scope.content = f.diff
    })

   	$scope.icon = 'glyphicon glyphicon-info-sign';

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
