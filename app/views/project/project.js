'use strict';

var resv = angular.module('InmantaApp.projectView', ['ui.router', 'inmantaApi', 'ngTable','inmanta.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
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
}]);



resv.controller('projectviewController', ['$scope', 'inmantaService', "$stateParams", "BackhaulTable", "$q",'dialogs','$rootScope',
    function($scope, inmantaService, $stateParams, BackhaulTable,$q,dialogs,$rootScope) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return inmantaService.getEnvironmentsByProject($stateParams.project)
           }
        );

	$scope.deleteEnv = function(env){
		var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the environment " + env.name);
		dlg.result.then(function(btn){
			inmantaService.removeEnvironment(env.id).then( function(){$rootScope.$broadcast('refresh');});
		})
	}  	

}]);
