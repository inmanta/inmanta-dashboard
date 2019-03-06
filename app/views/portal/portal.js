'use strict';

var versions = [
    {
        "version": 1551907841,
        "environment": "8b13c9a6-0cef-4dbb-87b2-22f95cdac3fa",
        "date": "2019-03-06T21:30:41.914000",
        "released": true,
        "deployed": true,
        "result": "success",
        "status": {
            "9ea0fde1-5bf5-53ef-afe6-449b51fd915b": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_1]"
            },
            "0073b20f-0a55-578b-ad29-20dea1b794a3": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_2]"
            },
            "027a0e77-2a82-515e-a68c-1c705bb410e2": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_345]"
            },
            "b3d25f56-2794-5800-a256-7f9cec9d8ae0": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_567]"
            },
            "190330bc-c63e-58d1-95c1-ae2389764925": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1000]"
            },
            "70361f25-c6d3-52ac-8092-16a4b217eac8": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1001]"
            },
            "d11b4065-d5a0-5ce4-8d83-b648824ff1c4": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1002]"
            },
            "292e4dd7-0d19-5ebd-b2b4-4e0c8f05b408": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4000]"
            },
            "f405bb3b-8c2e-563c-b9f2-b30f03e551ec": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4001]"
            },
            "ef86325f-1333-523c-a2f6-aa9e99dd8599": {
                "status": "deployed",
                "id": "junos::RoutingInstance[ALR-UNET-SYDNEY-CR01,name=ri-EVPN-123]"
            },
            "ffabf206-24bc-599b-b7a6-a07560cc3456": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=ALR-UNET-SYDNEY-CR01]"
            },
            "2541e4a4-a04e-53c0-bab3-0d21f9bf2f1b": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=cpe-4]"
            },
            "3dbfab8b-ce86-5e1c-9262-e17ade8d12b7": {
                "status": "deployed",
                "id": "vrpos::Interface[cpe-4,identifier=3]"
            },
            "17fdbce7-3cad-5f41-bbb7-99be9234ed0f": {
                "status": "deployed",
                "id": "vrpos::Vlan[cpe-4,port_vlan=3_100]"
            },
            "d432c94c-aeec-5860-a5bf-f85ea7f89c9f": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=cpe-5]"
            },
            "fd26c130-25f5-57c1-a46d-f3db3d44642b": {
                "status": "deployed",
                "id": "vrpos::Interface[cpe-5,identifier=3]"
            },
            "71949834-04b9-5ea5-86c2-8a8c65c19152": {
                "status": "deployed",
                "id": "vrpos::Vlan[cpe-5,port_vlan=3_100]"
            },
            "9266d4df-86c1-5c6f-9d2a-7ca81e2b1078": {
                "status": "deployed",
                "id": "junos::FirewallFilter[ALR-UNET-SYDNEY-CR01,name=BUM-EVPN-123]"
            },
            "17be1d43-2094-54e7-8d86-4a5f6f5918f9": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1003]"
            },
            "c32f5bf9-e19e-546b-ad93-b4e4338f7b03": {
                "status": "deployed",
                "id": "api::state::Event[internal,instance_id=3bf4fced-a921-461c-b8da-cf694aeac874]"
            }
        },
        "version_info": {
            "export_metadata": {
                "message": "Compile triggerd from the dashboard",
                "type": "dashboard",
                "hostname": "03663d4110f0",
                "inmanta:compile:state": "success"
            },
            "model": null
        },
        "total": 20,
        "undeployable": [],
        "skipped_for_undeployable": [],
        "id": "34c66a30-4938-413a-b14e-dc571a52cdfd",
        "done": 20
    },
    {
        "version": 1551907792,
        "environment": "8b13c9a6-0cef-4dbb-87b2-22f95cdac3fa",
        "date": "2019-03-06T21:29:52.415000",
        "released": true,
        "deployed": false,
        "result": "deploying",
        "status": {
            "29f2b553-cb0f-5517-9f95-7c5292dc1e77": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_1]"
            },
            "99080bcd-f7c4-5acd-8cf1-62969f1ef5a4": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_2]"
            },
            "15fd676c-0adc-5d8b-8d1c-a0c43f67b4f2": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_345]"
            },
            "8fff0395-f3cc-5f58-9ecb-51881027def4": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_567]"
            },
            "a8ed4a88-8456-58af-ba71-f4e4b596e559": {
                "status": "deployed",
                "id": "junos::FirewallFilter[ALR-UNET-SYDNEY-CR01,name=BUM-EVPN-123]"
            },
            "a0f69e73-a06a-570c-a6d3-cca931a77744": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1000]"
            },
            "89a1c376-2bfd-5a62-8697-1b6cd24930ae": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1001]"
            },
            "bf3d0231-a965-5d9e-bc75-8bd4d7ae6fd8": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1002]"
            },
            "968cb0a1-61df-588b-8927-cba57c1fe96e": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4000]"
            },
            "21e21da0-a409-54d6-bdb1-00e6da27c7e3": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4001]"
            },
            "694840a3-2894-597c-b7d2-f947d47ad256": {
                "status": "deployed",
                "id": "junos::RoutingInstance[ALR-UNET-SYDNEY-CR01,name=ri-EVPN-123]"
            },
            "8b46dbbf-f5bc-556b-a728-7016e4d46270": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=ALR-UNET-SYDNEY-CR01]"
            },
            "b85ba3e4-71d9-5954-8d28-d62897075677": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=cpe-4]"
            },
            "8c0b5068-92c8-5e74-9744-26be47737fda": {
                "status": "deployed",
                "id": "vrpos::Interface[cpe-4,identifier=3]"
            },
            "efb14ef4-12a5-5271-92b2-5a88993aba37": {
                "status": "deployed",
                "id": "vrpos::Vlan[cpe-4,port_vlan=3_100]"
            }
        },
        "version_info": {
            "export_metadata": {
                "message": "Compile triggerd from the dashboard",
                "type": "dashboard",
                "hostname": "03663d4110f0",
                "inmanta:compile:state": "success"
            },
            "model": null
        },
        "total": 20,
        "undeployable": [],
        "skipped_for_undeployable": [],
        "id": "2759701e-c8f6-4d13-b75d-584d923f1829",
        "done": 15
    },
    {
        "version": 1551907758,
        "environment": "8b13c9a6-0cef-4dbb-87b2-22f95cdac3fa",
        "date": "2019-03-06T21:29:18.975000",
        "released": true,
        "deployed": false,
        "result": "deploying",
        "status": {
            "4b2f96f0-aa98-5333-9de2-cf7c10cea911": {
                "status": "deployed",
                "id": "junos::FirewallFilter[ALR-UNET-SYDNEY-CR01,name=BUM-EVPN-123]"
            },
            "d35f0595-3891-59b3-b0fe-387b57ab4476": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4000]"
            },
            "dd0a3604-421a-592e-8e77-48baaddea2d5": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.4001]"
            },
            "2750fea5-6439-561a-b8be-de7cec19ae23": {
                "status": "deployed",
                "id": "junos::RoutingInstance[ALR-UNET-SYDNEY-CR01,name=ri-EVPN-123]"
            },
            "3e603949-9873-5fad-ae6f-3ccda74c162d": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1000]"
            },
            "8261499f-7d37-52c5-81d0-f7d9fb3e8a16": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1001]"
            },
            "cb5fff24-a227-5350-86e7-6ccd965feefb": {
                "status": "deployed",
                "id": "junos::Interface[ALR-UNET-SYDNEY-CR01,name=ae2.1002]"
            },
            "751aa875-8d05-5bda-b68b-9da4c9d03b3f": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_1]"
            },
            "77753bfb-d5e3-5747-8773-a4e86381dbac": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_2]"
            },
            "c3da1761-ea53-553f-a598-16824b362075": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_345]"
            },
            "c1addcf7-f61e-533a-bde9-7cca563c291a": {
                "status": "deployed",
                "id": "api::Service[internal,service_id=1_123_567]"
            },
            "038d6387-e015-5379-b973-b9aae63441d3": {
                "status": "deployed",
                "id": "std::AgentConfig[internal,agentname=ALR-UNET-SYDNEY-CR01]"
            }
        },
        "version_info": {
            "export_metadata": {
                "type": "LCM",
                "message": "test",
                "service_instance": "3bf4fced-a921-461c-b8da-cf694aeac874",
                "service_type": "ELAN",
                "hostname": "03663d4110f0",
                "inmanta:compile:state": "success"
            },
            "model": null
        },
        "total": 20,
        "undeployable": [],
        "skipped_for_undeployable": [],
        "id": "b014a3db-ba3b-423c-83e4-6fcead9cd478",
        "done": 12
    },
    {
        "version": 1551907742,
        "environment": "8b13c9a6-0cef-4dbb-87b2-22f95cdac3fa",
        "date": "2019-03-06T21:29:02.497000",
        "released": true,
        "deployed": false,
        "result": "deploying",
        "status": {},
        "version_info": {
            "export_metadata": {
                "type": "api",
                "message": "Recompile trigger through API call",
                "hostname": "03663d4110f0",
                "inmanta:compile:state": "success"
            },
            "model": null
        },
        "total": 1,
        "undeployable": [],
        "skipped_for_undeployable": [],
        "id": "44977316-34c4-41c4-9ea1-82aa9c18138a",
        "done": 0
    }
];

var module = angular.module('InmantaApp.portalView', ['ui.router', 'inmantaApi']);

module.config(['$stateProvider', function ($stateProvider) {
    $stateProvider
        .state('portal', {
            url: "/environment/:env/portal",
            views: {
                "body": {
                    templateUrl: "views/portal/portalBody.html",
                    controller: "PortalController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"
                }
            }
        });
}]);

module.controller('PortalController', ['$scope', '$rootScope', 'inmantaService', '$stateParams', '$state', 'dialogs', function ($scope, $rootScope, inmantaService, $stateParams, $state, dialogs) {
    $scope.state = $stateParams;

    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    var getReport = function () {
        inmantaService.getReportParameters($stateParams.env).then(function (d) {
            $scope.report = d;
        });
    };

    $scope.$on('refresh', getReport);
    getReport();

    var alertForUnknown = function () {
        inmantaService.getUnkownsForEnv($stateParams.env).then(function (unknowns) {
            var unknowns = unknowns.filter(function (unknown) { return unknown.source == 'form' });
            var out = {}
            unknowns.forEach(function (unknown) { out[unknown.metadata.form] = unknown })
            $scope.unknowns = Object.keys(out).map(function (key) {
                return out[key]
            });
        })
    };

    $scope.$on('refresh', alertForUnknown);
    alertForUnknown();

    var getVersionsHelper = function (range) {
        inmantaService.getVersionsPaged($stateParams.env, 0, range).then(
            function (d) {
                var total = d.count;

                var deployed;
                var newv;
                var state = 0;
                // 0 -> scanning for first, no deployed
                // 1 -> scanning for fist deployed
                // break -> found first deployed

                for (var i in d.versions) {
                    var v = d.versions[i]
                    if (state == 0) {
                        if (v.deployed) {
                            deployed = v;
                            break;
                        } else {
                            newv = v;
                            state = 1;
                        }
                    } else {
                        //state 1
                        //scanning for fist deployed
                        if (v.deployed) {
                            deployed = v;
                            break;
                        }
                    }
                }


                if (state == 1 && range < total) {
                    getVersionsHelper(range * 2);
                }

                $scope.newVersion = newv;
                $scope.lastVersion = deployed;
            })
    }

    var getVersions = function () {
        getVersionsHelper(10);
    }

    $scope.$on('refresh', getVersions);
    getVersions();

    $scope.startDryRun = function (res) {
        var resVersion = res.version;
        inmantaService.dryrun($stateParams.env, resVersion).then(function (d) {
            $rootScope.$broadcast('refresh');
        });
    }

    $scope.deploy = function (res) {
        var resVersion = res.version;
        inmantaService.deploy($stateParams.env, resVersion, true).then(function (d) { $rootScope.$broadcast('refresh') });
    }
}]);
