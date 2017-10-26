'use strict';

var inmantaApi = angular.module('InmantaApp.directives', []);

inmantaApi.filter('nozero', function() {
    return function(input) {
        if (input == 0) {
            return "";
        }
        return input;
    };
});

inmantaApi.directive("deployProgress", function() {
    var typesSeq = ['failed',  'undefined', 'skipped', 'deployed', 'unavailable', 'cancelled',];
    var types = {
        'deployed': 'success',
        'skipped': 'info',
        'failed': 'danger',
        'unavailable': 'warning',
        'cancelled': 'info',
        'undefined': 'warning'
    }

    var getProgress = function(version) {
        var prog = {};
        var bars = [];
        var status = version.status;
        var total = version.total;
        for (var res in status) {
            var state = status[res].status;
            if (state in prog) {
                prog[state]++;
            } else {
                prog[state] = 1;
            }
        }

        typesSeq.forEach(function(key) {
            var value = prog[key];
            if (value) {
                bars.push({
                    "name": key,
                    "value": value * 100 / total,
                    "label": value,
                    "type": types[key]
                });
            }
        });

        var progress = {
            'total': version.total,
            'bars': bars,
            'done': version.done
        };

        return progress;
    }

    return {
        restrict: 'E',
        templateUrl: 'partials/directives/deployProgress.html',
        transclude: true,
        scope: {
            datain: '=data',
            name: '=name',
            action: '=',
            emptyaction: '=?emptyaction',
            emptyname: '=?emptyname'
        },
        link: function(scope, element, attrs) {
            scope.width = 10;
            if (attrs["width"]) {
                scope.width = attrs["width"]
            }

            scope.remainder = 10 - scope.width;
            scope.data = null;
            scope.$watch('datain', function(newValue, oldValue) {
                if (newValue) {
                    scope.data = getProgress(newValue)
                }
            }, true)
        }
    };
});

inmantaApi.directive("imBreadcrumb", ['$stateParams', 'inmantaService', function($stateParams, inmantaService) {
    return {
        restrict: 'E',
        templateUrl: 'partials/directives/breadcrumb.html',
        scope: {
            name: '=?name',
            id: '=?id'
        },
        link: function(scope, element, attrs) {
            scope.breadcrumb = [];

            function addItem(name, id, sref){
                var out = {
                    name: name,
                    id: id,
                    sref: sref,
                    last: false
                };
                scope.breadcrumb.push(out);
                return out;
            }

            addItem("Home", null, "projects");
            if ($stateParams.env) {
                 var envi = addItem("Environment", "", "envs({env:'" + $stateParams.env + "'})");
                 inmantaService.getEnvironment($stateParams.env).then(function(d) {
                     envi.id = d.name;
                 })
            }

            if ($stateParams.version) {
                addItem("Version", $stateParams.version, "resources({env:'" + $stateParams.env + "',version:'" + $stateParams.version + "'})");
            }

            if (attrs["name"]) {
                addItem(scope.name, scope.id, null);
            }
            scope.breadcrumb[scope.breadcrumb.length - 1].last = true;
        }
    };
}])
