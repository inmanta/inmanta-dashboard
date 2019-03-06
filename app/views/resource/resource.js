"use strict";

var resv = angular.module("InmantaApp.resourceView", ["ui.router", "inmantaApi", "ngTable", "dialogs.main", "InmantaApp.resourceDetail", "InmantaApp.fileDetail", "inmanta.services.backhaul"])

resv.directive("inmantaStatus", ["resourceStates", function (resourceStates) {
    return {
        restrict: "E",
        scope: {
            resource: "=resource"
        },
        templateUrl: "views/resource/resourceStatus.html",
        link: function (scope, element, attrs) {
            var update = function() {
                var stateInfo = resourceStates[scope.resource.status];
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

                scope.status = scope.resource.status;
                if (stateInfo.name) {
                    scope.status = stateInfo.name;
                }
            }
            scope.$watch("resource", update);
            update();
        }
    };
}]);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state("resources", {
        url: "/environment/:env/version/:version",
        views: {
            "body": {
                templateUrl: "views/resource/resourceBody.html",
                controller: "resourceController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller("resourceButtonController", ["$scope", "$rootScope", "inmantaService", "$stateParams",
    function ($scope, $rootScope, inmantaService, $stateParams) {
        $scope.dryrun = function () {
            inmantaService.dryrun($stateParams.env, $stateParams.version).then(function (d) {
                $scope.dryrunid = d.id;
                $rootScope.$broadcast("refresh");
            });
        };

        $scope.deploy = function () {
            inmantaService.deploy($stateParams.env, $stateParams.version, true).then(function(d) { $rootScope.$broadcast("refresh"); });
        };
    }
]);

resv.controller("resourceController",
             ["$scope", "$rootScope", "inmantaService", "$stateParams", "BackhaulTable", "dialogs", "resourceStates", "$q",
    function ($scope, $rootScope, inmantaService, $stateParams, BackhaulTable, dialogs, resourceStates, $q) {
        $scope.state = $stateParams;
        $scope.toHighlight = null;
        $scope.highlight = function (name) {
            if ($scope.toHighlight == name) {
                $scope.toHighlight = null;
            } else
                $scope.toHighlight = name;
        };

        $scope.deploy = function () {
            inmantaService.deploy($stateParams.env, $stateParams.version, true).then(function(d) { $rootScope.$broadcast("refresh"); });
        }

        $scope.tableParams = new BackhaulTable($scope, {
            page: 1, // show first page
            count: 25, // count per page
            sorting: {
                "entity_type": "asc" // initial sorting
            }
        }, function (params) {
            var open_state = {};
            angular.forEach(params.data, function(item) {
                open_state[item.id] = item.deps_open;
            });

            return inmantaService.getResources($stateParams.env, $stateParams.version).then(function (info) {
                $scope.status = info.model;
                var data = info.resources;
                $scope.alldata = {};
                angular.forEach(data, function (item) {
                    if (open_state[item.id]) {
                        item.deps_open = open_state[item.id]
                    } else {
                        item.deps_open = false;
                    }
                    $scope.alldata[item.id] = item;
                });
                angular.forEach(data, function (item) {
                    $scope.deporder(item);
                    var requires_ids = [];
                    angular.forEach(item.attributes.requires, function(req) {
                        var id_dict = inmantaService.parseID(req);
                        id_dict.id = req;
                        requires_ids.push(id_dict);
                    });
                    item.requires_ids = requires_ids;
                });
                return data;
            });
        });
        $scope.resources = null;

        $scope.deporderInt = function (id) {
            if (!$scope.alldata[id]) {
                var order = Math.max.apply(null, $scope.alldata[id].attributes.requires.map($scope.deporderInt));
                order = Math.max(order, 0) + 1;
                $scope.alldata[id].deporderv = order;
                return order;
            }
            return $scope.alldata[id].deporderv;
        };

        $scope.deporder = function (item) {
            var out = $scope.deporderInt(item.id);
            item.deporder = out;
            return out;
        };

        $scope.details = function (item) {
            dialogs.create("views/resourceDetail/resourceDetail.html", "resourceDetailCtrl", {
                resource: item,
                env: $stateParams.env
            }, {});
        };

        $scope.open = function (item) {
            dialogs.create("views/fileDetail/fileDetail.html", "fileDetailCtrl", {
                resource: item,
                env: $stateParams.env
            }, {});
        };

        $scope.states = function () {
            var def = $q.defer();
            var names = [];
            angular.forEach(resourceStates, function(item, key) {
                if (item.filter) {
                    names.push({"id": key, "title": key});
                }
            });

            def.resolve(names);
            return def;
        };

        $scope.setsort = function (name) {
            $scope.tableParams.filter()["status"] = name;
        }

        $scope.resources = null;
        inmantaService.getEnvironment($stateParams.env).then(function (d) {
            $scope.env = d;
        });
    }
]);