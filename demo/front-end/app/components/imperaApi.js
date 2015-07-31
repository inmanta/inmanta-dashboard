'use strict';

/**
 * @ngdoc service
 * @name impWebApp.Nodeservice
 * @description # Nodeservice Service in the impWebApp.
 */
var imperApi = angular.module('imperaApi',['imperaApi.config'])

function formatDate(d){
    if(d == null)
        return d
    return new Date(d)
}

function formateVersion(d){
    d["date"] = formatDate(d["date"]); 
}

imperApi.service('imperaService',
	function Nodeservice($http,imperaConfig) {
		var impAPI = {};
		var impURL = imperaConfig.backend;

		impAPI.getProjects = function() {
			return $http.get(impURL + 'project').then(function(data){ return data.data;});
		};
		
		impAPI.getEnvironments = function() {
			return $http.get(impURL + 'environment').then(function(data){ return data.data;});
		};
		
		impAPI.getVersions = function(env) {
			return $http.get(impURL + 'cmversion',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.forEach(formateVersion)
                    return data.data;});
		};

		return impAPI;
});




