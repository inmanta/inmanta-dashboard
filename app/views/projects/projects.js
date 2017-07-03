'use strict';

var resv = angular.module('InmantaApp.projectsView', ['ui.router', 'inmantaApi', 'ngTable','inmanta.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('projects', {
            url: "/projects",
            views: {
                "body": {
                    templateUrl: "views/projects/projectBody.html",
                    controller: "projectsviewController"
                },
                "side": {
                    templateUrl: "partials/emptysidebar.html"

                }
            }

        })
}]);



resv.controller('projectsviewController', ['$scope', 'inmantaService', '$rootScope', "$stateParams", "BackhaulTable", "$q",'dialogs',
    function($scope, inmantaService,$rootScope, $stateParams, BackhaulTable,$q, dialogs) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return inmantaService.getProjects()
           }
        );
        
        
        $scope.deleteProject = function(project){
            var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the project " + project.name);
		    dlg.result.then(function(btn){
			    inmantaService.removeProject(project.id).then( function(){$rootScope.$broadcast('refresh');});
		    })
            
        }

    }

    
]);
