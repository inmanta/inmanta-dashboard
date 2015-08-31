'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'hljs',
  'ImperaApp.portalView',
  'ImperaApp.resourceView',
  'ImperaApp.envView',
  'ImperaApp.addEnv',
  'ImperaApp.addProject',
  'ImperaApp.graphView',
  'imperaApi.config',
  'ImperaApp.agentsView',
  'ImperaApp.prametersView',
  'ImperaApp.logsView'
])

app.config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/portal");   
})

app.controller("configCtrl",["$scope","imperaConfig",function($scope,imperaConfig){
  $scope.config=imperaConfig
}])

app.service("alertService",function alertService($rootScope){
	var alerts = [];
	var alertService = {};
	
	alertService.add=function(type,data){
		alerts.push({type:type,msg:data})
		$rootScope.$broadcast("alert-update",alerts)
	}
    
   
    
	return alertService;
})

app.config(function($httpProvider){
  $httpProvider.interceptors.push(function($q,alertService) {
    return {
      'responseError': function(rejection) {
        // do something on error
        alertService.add("danger",rejection.data?rejection.data.message:rejection.statusText)
        return $q.reject(rejection);
        }
    }
                                   
  });
})

app.controller("alertCtrl",["$scope",function($scope){
  $scope.alerts = []

  $scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams){
        $scope.alerts.length = 0
        
  })

  $scope.$on("alert-update",function(event,args){
  	$scope.alerts = args;
  })

  
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
 
}])



