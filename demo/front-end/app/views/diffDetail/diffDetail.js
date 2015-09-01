'use strict';

var rscdet = angular.module('ImperaApp.diffDetail', ['imperaApi','dialogs.main'])

rscdet.controller('diffDetailCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//
    $scope.content=""
   
    imperaService.getDiff(data.diff[0],data.diff[1]).then(function(f){
        $scope.content = f.diff
    })
    


   	$scope.icon = 'glyphicon glyphicon-info-sign';

    

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
