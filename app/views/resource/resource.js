"use strict";

var resv = angular.module("InmantaApp.resourceView", [
    "ui.router",
    "inmantaApi",
    "ngTable",
    "dialogs.main",
    "InmantaApp.fileDetail",
    "inmanta.services.backhaul"
]);

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

    $stateProvider.state("resourceDetail", {
        url: "/environment/:env/version/:version/:resourceId",
        views: {
            "body": {
                templateUrl: "views/resource/resourceDetail.html",
                controller: "resourceDetailController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.directive("inmantaStatus", ["resourceStates", function (resourceStates) {
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

resv.directive("inmantaAttributeInput", ["inmantaService", function(inmantaService) {
    return {
        restrict: "E",
        scope: {
            attribute: "=attribute",
        },
        templateUrl: "views/resource/attribute-input.html",
        link: function(scope, element, attrs) {
            scope.textarea_id = "ta-" + scope.attribute.name;
            scope.textarea_rows = 4;
            var update = function() {
            };

            scope.$watch("attribute", update);
            update();


            scope.getFile = function(file_id) {
                inmantaService.getFile(file_id).then(function (f) {
                    scope.attribute.file_content = f.content;
                });
            }
        }
    }
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

function parseRequires(requires, parser) {
    var requires_ids = [];
    angular.forEach(requires, function(req) {
        var id_dict = parser(req);
        id_dict.id = req;
        id_dict.resource_id = id_dict.entity_type + "[" + id_dict.agent_name + "," + id_dict.attribute + "=" + id_dict.attribute_value + "]";
        requires_ids.push(id_dict);
    });
    return requires_ids;
}

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
                    item.requires_ids = parseRequires(item.attributes.requires, inmantaService.parseID);
                });
                return data;
            });
        });

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

        $scope.states = function () {
            var def = $q.defer();
            var names = [];
            angular.forEach(resourceStates, function(item, key) {
                if (item.filter) {
                    names.push({"id": key, "title": (item.name) ? item.name : key});
                }
            });
            def.resolve(names);
            return def;
        };

        $scope.setsort = function (name) {
            $scope.tableParams.filter()["status"] = name;
        }

        inmantaService.getEnvironment($stateParams.env).then(function (d) {
            $scope.env = d;
        });
    }
]);

resv.controller("resourceDetailController", ["$scope", "inmantaService", "$stateParams", "BackhaulTable", "dialogs",
                function ($scope, inmantaService, $stateParams, BackhaulTable, dialogs) {
    $stateParams.id = window.decodeURIComponent($stateParams.resourceId);
    $scope.id = $stateParams.id;
    $scope.version = $stateParams.version;
    $stateParams.version = $scope.version;
    $scope.env = $stateParams.env;

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1, // show first page
        count: 25, // count per page
        sorting: {
            "timestamp": "desc" // initial sorting
        }
    }, function (prms) {
        var state = {};
        angular.forEach(prms.data, function(line) {
            state[line.action_id] = line.open;
        });
        
        return inmantaService.getLogForResource($stateParams.env, $stateParams.id + ",v=" + $stateParams.version).then(function (info) {
            var data = info.logs;
            var i;
            for (i in data) {
                data[i].open = false;
                if (state[data[i].action_id]) {
                    data[i].open = true;
                }
            }
            return data;
        });
    });

    // load the resource
    inmantaService.getResource($stateParams.env, $stateParams.id + ",v=" + $stateParams.version).then(function (resource) {
        $scope.resource = resource;
        $scope.attributes = [];
        angular.forEach(resource.attributes, function(value, key) {
            var element = {
                name: key,
                value: value,
                undefined: value == "<<undefined>>",
                multiline: value.length > 80 || (value.indexOf && value.indexOf("\n") >= 0),
                file: key == "hash",
            };
            element["type"] = "input";
            if (key.indexOf("password") >= 0) {
                element.type = "password";
            }
            if (angular.isObject(value)) {
                element.value = JSON.stringify(value);
                element.multiline = element.value.length > 80 || (element.value.indexOf && element.value.indexOf("\n") >= 0);
            }
            if (key != "version" && key != "requires") {
                $scope.attributes.push(element);
            }
        });

        $scope.requires = parseRequires(resource.attributes.requires, inmantaService.parseID);
    });

    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    $scope.details = function (item) {
        dialogs.create('views/resource/logDetail.html', 'logDetailCtrl', {
            message: item,
            env: $stateParams.env
        }, {});
    };
}]);

resv.controller('logDetailCtrl', ['$scope', '$modalInstance', 'data', "dialogs", function ($scope, $modalInstance, data, dialogs) {
    //-- Variables -----//
    $scope.header = " Log message details";
    $scope.env = data.env;
    $scope.kwargs = Object.keys(data.message.kwargs);
    $scope.message = data.message;

    $scope.icon = 'glyphicon glyphicon-info-sign';
}]); // end WaitDialogCtrl\ No newline at end of file