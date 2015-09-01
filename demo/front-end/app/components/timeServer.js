var services = angular.module('impera.services.time',[])


//based on kibana

services.service('timeSrv',
	function($rootScope,$timeout) {
        var timeSrv = {};
        var refresh, refresh_timer;

        timeSrv.setInterval = function (interval) {
            interval = timeSrv.interval_to_ms(interval)
            if (interval) {
               refresh = interval;
               timeSrv.start_refresh(interval);
            } else {
               timeSrv.cancel_refresh();
            }
        }

        timeSrv.refresh = function() {
            $rootScope.$broadcast('refresh');
        };

        timeSrv.start_refresh = function (after_ms) {
            timeSrv.refresh();
            timeSrv.cancel_refresh();
            refresh_timer = $timeout(function () {
                timeSrv.start_refresh(after_ms);
            }, after_ms);
        };

        timeSrv.cancel_refresh = function () {
           $timeout.cancel(refresh_timer);
        };


//from kibana

         interval_regex = /(\d+(?:\.\d+)?)([Mwdhmsy])/;

  // histogram & trends
  intervals_in_seconds = {
    y: 31536000,
    M: 2592000,
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1
  };


        timeSrv.describe_interval = function (string) {
            var matches = string.match(interval_regex);
            if (!matches || !intervals_in_seconds[matches[2]]) {
                throw new Error('Invalid interval string, expexcting a number followed by one of "Mwdhmsy"');
            } else {
                return {
                sec: intervals_in_seconds[matches[2]],
                type: matches[2],
                count: parseInt(matches[1], 10)
                };
            }
        };

        timeSrv.interval_to_ms = function(string) {
            var info = timeSrv.describe_interval(string);
            return info.sec * 1000 * info.count;
        };
        
        return timeSrv;

     
    }
)
