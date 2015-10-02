'use strict';

var resv = angular.module('ImperaApp.projectView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('project', {
            url: "/project/:project",
            views: {
                "body": {
                    templateUrl: "views/project/projectBody.html",
                    controller: "projectviewController"
                },
                "side": {
                    templateUrl: "partials/emptysidebar.html"

                }
            }

        })
});



resv.controller('projectviewController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable", "$q",'dialogs','$rootScope',
    function($scope, imperaService, $stateParams, BackhaulTable,$q,dialogs,$rootScope) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getEnvironmentsByProject($stateParams.project)
           }
        );

	$scope.deleteEnv = function(env){
		var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the environment " + env.name);
		dlg.result.then(function(btn){
			imperaService.removeEnvironment(env.id).then( function(){$rootScope.$broadcast('refresh');});
		})
	}  	

}]);
