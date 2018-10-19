'use strict';

var resv = angular.module('InmantaApp.fsm', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('fsm', {
        url: "/fsm/:env",
        views: {
            "body": {
                templateUrl: "views/fsm/fsm.html",
                controller: "fsmController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('instanceEventCtrl', ['$scope', '$modalInstance', 'data', "dialogs", function ($scope, $modalInstance, data) {
    //-- Variables -----//
    $scope.header = "Events for " + data.service_type + " " + data.instance_id;
    $scope.data = data;
    $scope.icon = 'glyphicon glyphicon-info-sign';
    //-- Methods -----//
    $scope.close = function () {
        $modalInstance.close();
        $scope.$destroy();
    }; // end close
}]); // end WaitDialogCtrl

resv.controller('fsmController', ['$scope', 'inmantaService', "$stateParams", "$q", "BackhaulTable", "dialogs",
        function ($scope, inmantaService, $stateParams, $q, BackhaulTable, dialogs) {
    $scope.state = $stateParams;

    var getFSM = function () {
        inmantaService.getParameters($stateParams.env, {'query': {'module': 'state'}}).then(function (info) {
            var data = [];
            info.parameters.forEach(function (item) {
                var transfers = {};
                item.metadata.transfer.forEach(function (x) {
                    if (!(x.from in transfers)) {
                        transfers[x.from] = [];
                    }
                    transfers[x.from].push(x.to);
                });
                item.transfers = transfers;
                data.push(item);
            });
            $scope.fsm = data;
        });
    };

    var getLCM = function () {
        inmantaService.getLCMServices($stateParams.env).then(function (data) {
            $scope.service_types = data.data;
            if ($scope.service_types.length == 0) {
                $scope.service_types = null;
            }

            $scope.service_instances = {};
            data.data.forEach(function (svc_type) {
                $scope.service_instances[svc_type.service_type] = new BackhaulTable($scope, {
                    page: 1,
                    count: 50,
                }, function (params) {
                    return inmantaService.getLCMServiceInstances($stateParams.env, svc_type.service_type).then(function (data) {
                        var tableData = [];
                        data.data.forEach(function (inst) {
                            inst.id_values = [];
                            svc_type.id_attributes.forEach(function (attr) {
                                inst.id_values.push(attr + "=" + inst.attributes[attr]);
                            });

                            tableData.push(inst);
                        });
                        return tableData;
                    });
                });
            });
        });
    };

    $scope.$on('refresh', getFSM);
    getFSM();
    if (inmantaService.getLCMServices) {
        getLCM();
    }

    $scope.events = function (stype, id, id_values) {
        inmantaService.getEvents($stateParams.env, stype, id).then(function (d) {
            dialogs.create('views/fsm/instance_events.html', 'instanceEventCtrl', {
                service_type: stype,
                instance_id: id,
                id_values: id_values,
                events: d.data,
                env: $stateParams.env
            }, {});
        });
    };
}]);
