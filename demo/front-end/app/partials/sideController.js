'use strict';

var resv = angular.module('ImperaApp.controllers.side', ['ui.router'])

resv.controller('sideController',['$scope','$stateParams',function($scope, $stateParams){
    $scope.state= $stateParams
}])
