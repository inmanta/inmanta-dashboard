'use strict';

var services = angular.module('inmanta.services.backhaul', ['ngTable']);

//tricky little service to cause data to be reloaded upon a refresh event
// but with the additional advantage that the front-end is only refreshed if
// 1- data has been received
// 2- the data has changed

// a back haul instance is constructed on the scope

// new Backhaul($scope)

services.service('Backhaul',
    ["$q", function ($q) {
        var backHaul = function backHaul(scope) {
            var data;

            var getData;
            var args;
            var reload;
            var first = true;

            var callGetData = function () {
                return getData.apply(null, args);
            };

            var refresh = function () {
                if (getData) {
                    callGetData().then(function (d) {
                        if (!angular.equals(data, d)) {
                            data = d;
                            reload();
                        }
                    });
                }
            };
            //this function expects n arguments
            //get(rld,gb,[args])
            // rld: a function to be called when a reload of the font-end must be triggered
            // gd: a function to the data, this function should return a promise
            // all following arguments are passed to gd

            //rld and gd should be the same each time a backhaul instance is called
            //when get is called the first time, it returns a promise for gd(*args)
            //when called a second time, with the same [args] cached data is returned
            //when called a second time, with different [args] it returns a promise for gd(*args)

            // if a refresh event is seen after the first call, gd(*args) is called and when the received data is different from before, rld is called

            this.get = function (rld, gd) {
                if (first) {
                    scope.$on("refresh", function () { refresh(); });
                    first = false;
                }

                var newargs = Array.prototype.slice.call(arguments, 2);
                getData = gd;
                reload = rld;
                if (data && angular.equals(args, newargs)) {
                    var out = $q.defer()
                    out.resolve(data);
                    return out.promise;
                } else {
                    args = newargs;
                    return callGetData().then(function (d) {
                        data = d;
                        return d;
                    })
                };
            }
            this.refresh = refresh;
        }
        return backHaul;
    }]
);

services.service('BackhaulTable', ["Backhaul", "NgTableParams", "$filter", function (Backhaul, ngTableParams, $filter) {
    return function (scope, params, getDataSub) {
        var backhaul = new Backhaul(scope);
        var tableParams = new ngTableParams(params, {
            getData: function (params) {
                var filters = {};
                angular.forEach(params.filter(), function (value, key) {
                    if (value == "") {
                        return;
                    }

                    var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                    if (!splitedKey) {
                        filters[key] = value;
                        return;
                    }

                    splitedKey = splitedKey.splice(1);

                    var father = splitedKey[0],
                        son = splitedKey[1];
                    if (!filters[father]) {
                        filters[father] = {};
                    }
                    filters[father][son] = value;
                });

                return backhaul.get(
                    function () {
                        params.reload()
                    },
                    getDataSub, params)
                    .then(function (data) {
                        var len = data.length;
                        var orderedData = params.filter() ?  $filter('filter')(data, filters) : data;

                        // use build-in angular filter
                        orderedData = params.sorting() ? $filter('orderBy')(orderedData, params.orderBy()) : orderedData;

                        params.total(orderedData.length);
                        return (orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    });
            }
        });
        tableParams.refresh = backhaul.refresh;
        return tableParams;
    }
}])

services.service('BackhaulTablePaged', ["Backhaul", "NgTableParams", "$filter", function (Backhaul, ngTableParams, $filter) {

    return function (scope, params, getDataSub, field) {
        var backhaul = new Backhaul(scope)

        var tableParams = new ngTableParams(params, {
            getData: function (params) {
                var filters = {};
                angular.forEach(params.filter(), function (value, key) {
                    var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                    if (!splitedKey) {
                        filters[key] = value;
                        return;
                    }

                    splitedKey = splitedKey.splice(1);

                    var father = splitedKey[0],
                        son = splitedKey[1];
                    filters[father] = {};
                    filters[father][son] = value;
                });

                return backhaul.get(
                    function () {
                        params.reload()
                    },
                    getDataSub, (params.page() - 1) * params.count(), params.count())
                    .then(function (info) {
                        var data = info[field]

                        var orderedData = params.filter() ?
                            $filter('filter')(data, filters) :
                            data;

                        // use build-in angular filter
                        orderedData = params.sorting() ?
                            $filter('orderBy')(orderedData, params.orderBy()) :
                            orderedData;

                        params.total(info.count);
                        return orderedData;

                    });

            }
        });
        return tableParams;
    }
}])