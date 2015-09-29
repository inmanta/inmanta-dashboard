'use strict';

var resv = angular.module('ImperaApp.projectView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('projects', {
            url: "/projects",
            views: {
                "body": {
                    templateUrl: "views/projects/projectBody.html",
                    controller: "projectviewController"
                },
                "side": {
                    templateUrl: "partials/emptysidebar.html"

                }
            }

        })
});



resv.controller('projectviewController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable", "$q",
    function($scope, imperaService, $stateParams, BackhaulTable,$q) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'id_fields.entity_type': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getProjects()
           }
        );

    }

    
]);
