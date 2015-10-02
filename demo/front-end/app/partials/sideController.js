'use strict';

var resv = angular.module('ImperaApp.controllers.side', ['ui.router'])

resv.controller('sideController',['$scope', '$rootScope', 'imperaService', "$stateParams",function($scope, $rootScope, imperaService, $stateParams) {
	$scope.state= $stateParams
	
	$scope.compile = function(env){
        imperaService.compile(env).then(function(){
            $scope.cstate=true; 
            $rootScope.$broadcast('refresh')  
        })
    }

    function getState(){
        if($scope.state.env){
            imperaService.isCompiling($scope.state.env).then(function(data){$scope.cstate=data;  })
        }
    }

    getState()
    $scope.$on("refresh",getState)
}])
