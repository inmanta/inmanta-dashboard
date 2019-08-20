'use strict';

var resv = angular.module('InmantaApp.controllers.side', ['ui.router'])

resv.controller('sideController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", function ($scope, $rootScope, inmantaService, $stateParams) {
	$scope.state = $stateParams;
}]);

resv.directive("inmantaConnection", ["resourceStates", function (resourceStates) {
    return {
        restrict: "E",
        scope: {
            resource: "=resource",
            status: "=?status",
        },
        templateUrl: "views/resource/resourceStatus.html",
        link: function (scope, element, attrs) {
            var update = function() {
                var status = scope.resource.status;
                if (scope.status) {
                    status = scope.status;
                }

                var stateInfo = resourceStates[status];
                scope.textClass = "text-" + stateInfo.label;
                scope.glyphClasses = "";
                if (stateInfo.icon && !scope.resource.attributes.purged) {
                    scope.glyphClasses += "glyphicon-" + stateInfo.icon;
                }
                if (scope.resource.attributes.purged) {
                    scope.glyphClasses += "glyphicon-trash";
                }
                if (stateInfo.inprogress) {
                    scope.glyphClasses += " spinner-fade";
                }

                scope.showstatus = status;
                if (stateInfo.name) {
                    scope.showstatus = stateInfo.name;
                }
            }
            scope.$watch("resource", update);
            update();
        }
    };
}]);