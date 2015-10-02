'use strict';

var resv = angular.module('ImperaApp.projectsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
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
});



resv.controller('projectsviewController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable", "$q",
    function($scope, imperaService, $stateParams, BackhaulTable,$q) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getProjects()
           }
        );

    }

    
]);
