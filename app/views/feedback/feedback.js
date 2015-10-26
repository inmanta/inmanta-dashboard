'use strict';

var rscdet = angular.module('ImperaApp.feedback', ['imperaApi','dialogs.main'])

rscdet.controller('feedbackCtrl',['$scope','$modalInstance','data','imperaService',
        function($scope,$modalInstance,data,imperaService) {
	//-- Variables -----//
    

	//-- Methods -----//
	
	$scope.submitFeedback = function(feedback) {
	    imperaService.sendFeedback(feedback).then(function(d){$modalInstance.close('closed');});
	    
	}
	
	$scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


//app.controller("modalAccountFormController", ['$scope', '$modal', '$log',

//    function ($scope, $modal, $log) {

//        $scope.showForm = function () {
//            $scope.message = "Show Form Button Clicked";
//            console.log($scope.message);

//            var modalInstance = $modal.open({
//                templateUrl: 'modal-form.html',
//                controller: ModalInstanceCtrl,
//                scope: $scope,
//                resolve: {
//                    userForm: function () {
//                        return $scope.userForm;
//                    }
//                }
//            });

//            modalInstance.result.then(function (selectedItem) {
//                $scope.selected = selectedItem;
//            }, function () {
//                $log.info('Modal dismissed at: ' + new Date());
//            });
//        };
//            }]);

//var ModalInstanceCtrl = function ($scope, $modalInstance, userForm) {
//    $scope.form = {}
//    $scope.submitForm = function () {
//        if ($scope.form.userForm.$valid) {
//            console.log('user form is in scope');
//            $modalInstance.close('closed');
//        } else {
//            console.log('userform is not in scope');
//        }
//    };
//};
