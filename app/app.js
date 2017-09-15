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
    'InmantaApp.logsView',
    'InmantaApp.reportView',
    'InmantaApp.controllers.refresh',
    'InmantaApp.controllers.projects',
    'InmantaApp.controllers.side',
    'InmantaApp.compileReport',
    'InmantaApp.formsView',
    'InmantaApp.snapshotView',
    'InmantaApp.snapshotDetailView',
    'InmantaApp.restoreView',
    'InmantaApp.settings'
]);

app.config(["$urlRouterProvider", function ($urlRouterProvider) {
    $urlRouterProvider.otherwise("/projects");
}]);

app.controller("configCtrl", ["$scope", "inmantaConfig", "dialogs", function ($scope, inmantaConfig, dialogs) {
    $scope.config = inmantaConfig;
}]);

app.service("alertService", ["$rootScope", function alertService($rootScope) {
    var alerts = [];
    var alertService = {};

    alertService.add = function (type, data) {
        var last = alerts[alerts.length - 1]
        if (last && last.msg == data) {
            last.times = last.times + 1;
        } else {
            alerts.push({ type: type, msg: data, times: 1 })
        }
        $rootScope.$broadcast("alert-update", alerts)
    };
    return alertService;
}]);

app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.interceptors.push(["$q", "authService", "alertService", function ($q, authService, alertService) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if (authService.keycloak.token) {
                    config.headers.Authorization = 'Bearer ' + authService.keycloak.token;
                }
                return config;
            },
            'responseError': function (rejection) {
                if (rejection.status === 401 || rejection.status === 403) {
                    alert = "Authentication is required by the server, please log-in";
                } else {
                    var alert = rejection.data ? rejection.data.message : rejection.statusText;
                    if (!alert) {
                        alert = "Could not connect to server";
                    }
                }
                alertService.add("danger", alert);
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
