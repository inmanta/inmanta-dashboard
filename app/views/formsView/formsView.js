'use strict';

var resv = angular.module('InmantaApp.formsView', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('forms', {
        url: "/environment/:env/forms?form",
        views: {
            "body": {
                templateUrl: "views/formsView/formsViewBody.html",
                controller: "formsController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"

            }
        }

    })
}]);

resv.directive('recordEditor', ['inmantaService', 'dialogs', 'BackhaulTable', '$rootScope', function (inmantaService, dialogs, BackhaulTable, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            env: '=',
            type: '=',
            highlight: '=?'
        },
        templateUrl: 'views/formsView/recordEditor.html',
        link: function (scope, element) {
            scope.cols = []
            function load() {
                if (scope.type != null) {

                    scope.tableParams = new BackhaulTable(scope, {
                        page: 1, // show first page
                        count: 50 // count per page
                    }, function (params) {
                        return inmantaService.getFullRecords(scope.env, scope.type).then(function (f) {
                            scope.allRecords = f;
                            return f;
                        });
                    });

                    inmantaService.getForm(scope.env, scope.type).then(
                        function (form) {
                            scope.selectedForm = form
                            scope.cols.length = 0
                            angular.forEach(form.fields, function (v, name) {
                                var field = "fields." + name
                                var filter = {};
                                filter[field] = 'text';

                                var password = false
                                if ((name in form.field_options) && ("widget" in form.field_options[name]) && (form.field_options[name]["widget"] == "password")) {
                                    password = true
                                }

                                scope.cols.push({
                                    title: name.replace('_', ' '),
                                    sortable: field,
                                    filter: filter,
                                    show: true,
                                    field: name,
                                    password: password
                                })
                            }
                            )
                            scope.cols.sort(function (a, b) {
                                return a.field > b.field;
                            });
                            scope.cols.push({
                                title: "",
                                show: true
                            })

                        }
                    )

                }
            }

            load();
            scope.$watch("type", load)


            scope.getOptionsFor = function (s) {
                return s.split(',')
            }

            var types = {
                "string": "text",
                "number": "text",
                "bool": "checkbox",
                "password": "password"
            }

            var defaultValues = {
                "string": "",
                "number": 0,
                "slider": 0,
                "bool": false
            }

            scope.getFormType = function (modeltype) {
                if (modeltype in types) {
                    return types[modeltype];
                }
                return "text"
            }

            var defaultFor = function (modeltype, selectedForm, name) {
                if (modeltype == "number" && selectedForm.field_options[name] && selectedForm.field_options[name]["min"]) {
                    var m = selectedForm.field_options[name].min
                    if (m > 0) {
                        return m;
                    }
                    return 0;
                }
                if (modeltype in defaultValues) {
                    return defaultValues[modeltype];
                }
                return ""
            }


            scope.delete = function (rec) {
                var dlg = dialogs.confirm("Confirm delete", "Do you really want to delete the record " + rec);
                dlg.result.then(function (btn) {
                    inmantaService.deleteRecord(scope.env, rec.id).then(function () { $rootScope.$broadcast('refresh') });
                })

            }


            scope.addNew = function (selectedForm) {
                var field = {}
                angular.forEach(selectedForm.fields, function (v, k) {
                    field[k] = defaultFor(v, selectedForm, k)
                })

                var record = { fields: field, form_type: selectedForm.form_type, edit: true }
                scope.edit(selectedForm, record)
            }


            scope.edit = function (form, record) {
                dialogs.create('views/formsView/formDialog.html', 'formDialogController', {
                    type: form,
                    record: record
                }, {}).result.then(function () { $rootScope.$broadcast('refresh') })

            }
        }
    }
}])

resv.controller('formsController', ['$scope', 'inmantaService', "$stateParams", function ($scope, inmantaService, $stateParams) {
    $scope.state = $stateParams;

    function load() {
        inmantaService.getForms($stateParams.env).then(function (forms) {
            $scope.forms = forms;
        });

        inmantaService.getUnkownsForEnv($stateParams.env).then(function (unknowns) {
            $scope.unknowns = unknowns.filter(function (unknown) { return unknown.source == 'form' }).map(function (unknown) {
                return unknown.metadata.form;
            });
        });
    }

    load();

    $scope.$on('refresh', load);

    $scope.selectForm = function (f) {
        $scope.sfi = f.type;
    }
}]);

resv.controller('formDialogController', ['$scope', 'inmantaService', "$stateParams", '$modalInstance', 'data', function ($scope, inmantaService, $stateParams, $modalInstance, data) {
    $scope.state = $stateParams;
    $scope.record = data.record;
    $scope.form = data.type;
    var types = {
        "string": "text",
        "number": "text",
        "bool": "checkbox"
    };

    var createOptions = function (name, type, options) {
        var out = {
            widget: getWidget(type, options)
        };
        if (options) {
            if (options['help']) {
                out['help'] = options['help']
            }

            if (out.widget == "options") {
                out['options'] = options['options'].split(',')
            }

            if (out.widget == "slider") {
                out['options'] = getSliderOptions(options)
            }

        }

        return out;
    };

    var getSliderOptions = function (opts) {
        if (!opts) {
            return {};
        }
        var minv = parseInt(opts.min)
        if (!minv) {
            minv = 0
        }
        var maxv = parseInt(opts.max)
        if (!maxv) {
            maxv = 100
        }
        return {
            from: minv,
            to: maxv,
            step: 1
        };
    };

    var getWidget = function (type, options) {
        if (options) {
            if (options['widget']) {
                return options['widget'];
            }
        }

        if (type in types) {
            return types[type];
        }
        return "text"
    };

    $scope.fieldList = []
    angular.forEach(data.type.fields, function (v, k) {
        $scope.fieldList.push({
            key: k,
            value: v,
            options: createOptions(k, v, data.type.field_options[k])

        })
    })
    $scope.fieldList.sort(function (a, b) {
        return a.key > b.key;
    });

    var save = function (rec) {
        if (!rec.id) {
            return inmantaService.createRecord($stateParams.env, rec.form_type, rec.fields);
        } else {
            return inmantaService.updateRecord($stateParams.env, rec.id, rec.fields);
        }
    };

    $scope.submit = function () {
        save($scope.record).then(function (f) {
            $modalInstance.close(f);
            $scope.$destroy();
        });
    };

    $scope.close = function () {
        $modalInstance.close();
        $scope.$destroy();
    };

}]);
