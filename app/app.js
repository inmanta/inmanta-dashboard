'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'hljs',
  'dialogs.main',
  'angularSpinner',
  'angularAwesomeSlider',
  'ch.filters',
  'ImperaApp.directives',
  'ImperaApp.portalView',
  'ImperaApp.projectsView',
  'ImperaApp.projectView',
  'ImperaApp.resourceView',
  'ImperaApp.resourceCentricView',
  'ImperaApp.envView',
  'ImperaApp.addEnv',
  'ImperaApp.editEnv',
  'ImperaApp.addProject',
  'ImperaApp.graphView',
  'imperaApi.config',
  'ImperaApp.agentsView',
  'ImperaApp.parametersView',
  'ImperaApp.logsView',
  'ImperaApp.reportView',
  'ImperaApp.deployReportView',
  'ImperaApp.controllers.refresh',
  'ImperaApp.controllers.projects',
  'ImperaApp.controllers.side',
  'ImperaApp.feedback',
  'ImperaApp.compileReport',
  'ImperaApp.formsView',
  'ImperaApp.snapshotView',
  'ImperaApp.snapshotDetailView',
  'ImperaApp.restoreView'
])

app.config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/projects");   
})

app.controller("configCtrl",["$scope","imperaConfig", "dialogs", function($scope, imperaConfig, dialogs){
  $scope.config=imperaConfig
  
  $scope.openFeedback = function(user_tenant_Id){
     dialogs.create('views/feedback/feedback.html','feedbackCtrl', { user:user_tenant_Id },{});    
  }
}])

app.service("alertService",function alertService($rootScope){
	var alerts = [];
	var alertService = {};
	
	alertService.add=function(type,data){
		var last = alerts[alerts.length-1]
		if(last && last.msg == data){
			last.times = last.times+1;
		}else{
			alerts.push({type:type,msg:data,times:1})
		}
		$rootScope.$broadcast("alert-update",alerts)
	}
    
   
    
	return alertService;
})

app.config(function($httpProvider){
  $httpProvider.interceptors.push(function($q,alertService) {
    return {
      'responseError': function(rejection) {
        // do something on error
	var alert = rejection.data?rejection.data.message:rejection.statusText
	if(!alert){
		alert="Could not connect to server";
	}
        alertService.add("danger",alert)
        return $q.reject(rejection);
        }
    }
                                   
  });
})

app.controller("alertCtrl",["$scope","imperaService",function($scope,imperaService){
  $scope.alerts = []
  $scope.env = null

  $scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams){
        $scope.alerts.length = 0
        $scope.env = toParams['env']
        alertForUnknown()
  })

  $scope.$on("alert-update",function(event,args){
  	$scope.alerts = args;
  })

  
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  
  //found no better place to park it,....
  function alertForUnknown(){
    if($scope.env){
        imperaService.getUnkownsForEnv($scope.env).then(function(unknowns){
            $scope.unknowns = unknowns.filter(function(unknown){return unknown.source=='form'})
        })
    }
  }  
  
  $scope.$on('refresh',alertForUnknown)
 
}])
