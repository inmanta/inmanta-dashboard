'use strict';

var resv = angular.module('InmantaApp.resourceCentricView', ['ui.router', 'inmantaApi', 'ngTable', 'dialogs.main',
                           'InmantaApp.fileDetail', 'inmanta.services.backhaul']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('resourceCentric', {
        url: "/environment/:env/resources",
        views: {
            "body": {
                templateUrl: "views/resourcecentric/resourceCentricBody.html",
                controller: "resourceCentricController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('resourceCentricController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTable", "dialogs", "$q",
                function ($scope, $rootScope, inmantaService, $stateParams, BackhaulTable, dialogs, $q) {
    $scope.state = $stateParams;

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1, // show first page
        count: 50 // count per page
    }, function (params) {
        return inmantaService.getResourcesState($stateParams.env).then(function (info) {
            $scope.env = info;
            $scope.versions = info.versions;

            var data = info.resources;
            angular.forEach(data, function (item) {
                item.idItems = inmantaService.parseID(item.resource_id);
            });
            return data;
        });
    });
    $scope.resources = null;

    $scope.setFilter = function (field, value) {
        $scope.tableParams.filter()[field] = value;
    };
}
]);
