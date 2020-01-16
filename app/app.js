'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('InmantaApp', [
    'ui.router',
    'ui.bootstrap',
    'ngTable',
    'hljs',
    'dialogs.main',
    'angularSpinner',
    'angularAwesomeSlider',
    'ch.filters',
    'InmantaApp.directives',
    'InmantaApp.portalView',
    'InmantaApp.projectsView',
    'InmantaApp.projectView',
    'InmantaApp.resourceView',
    'InmantaApp.resourceCentricView',
    'InmantaApp.envView',
    'InmantaApp.addEnv',
    'InmantaApp.editEnv',
    'InmantaApp.addProject',
    'InmantaApp.graphView',
    'inmantaApi.config',
    'InmantaApp.agentsView',
    'InmantaApp.parametersView',
    'InmantaApp.reportView',
    'InmantaApp.controllers.refresh',
    'InmantaApp.controllers.projects',
    'InmantaApp.controllers.side',
    'InmantaApp.compileReport',
    'InmantaApp.settings',
    'InmantaApp.fsm',
    'InmantaApp.status',
    'InmantaApp.compilequeue',
]);

app.config(["$urlRouterProvider", function ($urlRouterProvider) {
    $urlRouterProvider.otherwise("/projects");
}]);

/*
 All resource states and information on how to represent them:
    label: The type of bootstrap label to apply
    inprogress: This is an inprogress state
    filter: Expose this state in any filters
    queue: The resource is queued to processing
*/
app.constant("resourceStates", {
    available: {
        label: "muted",
        inprogress: false,
        filter: true,
        queue: true,
    },
    deployed: {
        label: "success",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "ok",
    },
    skipped: {
        label: "info",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "fast-forward",
    },
    skipped_for_undefined: {
        label: "info",
        name: "skip undef",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "fast-forward",
    },
    failed: {
        label: "danger",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "remove",
    },
    unavailable: {
        label: "warning",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "remove",
    },
    cancelled: {
        label: "info",
        inprogress: false,
        filter: false,
        queue: false,
    },
    undefined: {
        label: "warning",
        inprogress: false,
        filter: true,
        queue: false,
        icon: "question-sign",
    },
    deploying: {
        label: "primary",
        inprogress: true,
        filter: true,
        queue: false,
        icon: "ok",
    },
});

app.controller("configCtrl", ["$scope", "inmantaConfig", "dialogs", function ($scope, inmantaConfig, dialogs) {
    $scope.config = inmantaConfig;
}]);

app.service("alertService", ["$rootScope", function alertService($rootScope) {
    var alerts = [];
    var alertService = {};

    alertService.add = function (type, data) {
        var last = alerts[alerts.length - 1];
        if (last && last.msg == data) {
            last.times = last.times + 1;
        } else {
            alerts.push({ type: type, msg: data, times: 1 });
        }
        $rootScope.$broadcast("alert-update", alerts);
    };
    return alertService;
}]);

app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.interceptors.push(["$q", "$rootScope", "authService", "alertService", function ($q, $rootScope, authService, alertService) {
        $rootScope.connectionStatus = "connecting";
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if (authService.enabled && authService.keycloak.token) {
                    config.headers.Authorization = 'Bearer ' + authService.keycloak.token;
                }
                return config;
            },
            'response': function(response) {
                $rootScope.connectionStatus = "connected";
                return response;
            },
            'responseError': function (rejection) {
                alert = null;
                if (rejection.status === 401 || rejection.status === 403) {
                    if (authService.enabled) {
                        alert = "Authentication is required by the server, please log-in";
                        authService.keycloak.clearToken();
                        authService.authn = false;
                        authService.username = null;
                        authService.userinfo = null;
                    } else {
                        alert = "Authentication is required by the server, but disabled in dashboard. Check server config.";
                    }
                } else if (rejection.status <= 0) {
                    // status 0 means connection refused
                    $rootScope.connectionStatus = "disconnected";
                } else {
                    var alert = rejection.data ? rejection.data.message : rejection.statusText;
                    if (!alert) {
                        alert = "Could not connect to server";
                    }
                }
                if (alert) {
                    alertService.add("danger", alert);
                }
                return $q.reject(rejection);
            }
        }
    }]);
}]);

app.controller("alertCtrl", ["$scope", "inmantaService", function ($scope, inmantaService) {
    $scope.alerts = [];
    $scope.env = null;

    $scope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
        $scope.alerts.length = 0;
        $scope.env = toParams['env'];
    })

    $scope.$on("alert-update", function (event, args) {
        $scope.alerts = args;
    })

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
}]);
