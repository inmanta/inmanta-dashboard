'use strict';

var rscdet = angular.module('InmantaApp.diffDetail', ['inmantaApi','dialogs.main'])

rscdet.controller('diffDetailCtrl',['$scope','$modalInstance','data','inmantaService',function($scope,$modalInstance,data,inmantaService){
	//-- Variables -----//
    $scope.content=""
    $scope.header=data.id
    inmantaService.getDiff(data.diff.current,data.diff.desired).then(function(f){
        $scope.content = f.diff
    })

   	$scope.icon = 'glyphicon glyphicon-info-sign';

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl
