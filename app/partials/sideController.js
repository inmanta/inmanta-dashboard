'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router'])

resv.controller('sideController',['$scope', '$rootScope', 'inmantaService', "$stateParams",function($scope, $rootScope, inmantaService, $stateParams) {
	$scope.state= $stateParams
	
	
}])
