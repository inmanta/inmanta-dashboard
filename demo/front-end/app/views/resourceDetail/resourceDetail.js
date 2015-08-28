'use strict';

var rscdet = angular.module('ImperaApp.resourceDetail', ['imperaApi','dialogs.main'])

rscdet.controller('resourceDetailCtrl',['$scope','$modalInstance','data',"dialogs",function($scope,$modalInstance,data,dialogs){
	//-- Variables -----//

	$scope.header = "Details for " + data.resource.id ;
    
   

    $scope.keys = Object.keys(data.resource.fields)
    $scope.data = data.resource

	$scope.icon = 'glyphicon glyphicon-info-sign';

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close


    $scope.open = function() {
            dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                resource: $scope.data
            }, {})

    }
}]); // end WaitDialogCtrl
