'use strict';

var resv = angular.module('InmantaApp.addProject', ['ui.router', 'inmantaApi', 'ngTable'])

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('addProject', {
        url: "/addProject",
        views: {
            "body": {
                templateUrl: "views/addProject/addProject.html",
                controller: "addProjectController"
            },
            "side": {
                templateUrl: "partials/emptysidebar.html"
            }
        }
    });
}]);

resv.controller('addProjectController', ['$scope', 'inmantaService', '$state', function ($scope, inmantaService, $state) {
    $scope.name = null;

    $scope.ready = function () {
        return $scope.selectedProject;
    }
    inmantaService.getProjects().then(function (data) {
        $scope.projects = data;
    });

    $scope.addProject = function (name) {
        //console.log(project,name,repo,tag)
        inmantaService.addProject(name).then(function (d) { $state.go("addEnv", { project: d.id }); });
    };

    $scope.projects = null

}]);