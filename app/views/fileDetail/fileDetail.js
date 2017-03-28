'use strict';

var rscdet = angular.module('ImperaApp.fileDetail', ['imperaApi','dialogs.main'])

rscdet.controller('fileDetailCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//

	$scope.header = "Details for " + data.resource.id ;
    $scope.id = data.resource.attributes.hash;
   	$scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.content=""
    imperaService.getFile($scope.id).then(function(f){
        $scope.content = f.content
    })
    

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
