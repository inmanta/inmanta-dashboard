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
	function Nodeservice($http,imperaConfig,$q) {
		var impAPI = {};
		var impURL = imperaConfig.backend;
		var envCache ={}

		impAPI.getProjects = function() {
			return $http.get(impURL + 'project').then(function(data){ return data.data;});
		};
	
        impAPI.addProject = function(name) {
			return $http.put(impURL + 'project',{'name':name}).then(function(data){ return data.data;});
		};

        impAPI.addEnvironment = function(projectid, name) {
			return $http.put(impURL + 'environment',{'project_id':projectid,'name':name}).then(function(data){ return data.data;});
		};

        impAPI.removeEnvironment = function(envid) {
			return $http.delete(impURL + 'environment/'+envid);
		};
		
		impAPI.getEnvironments = function() {
			return $http.get(impURL + 'environment').then(function(data){ 
				data.data.forEach(function(d){envCache[d.id]=d})
				return data.data;});
		};

        impAPI.getEnvironment = function(id){
            if( envCache[id]){
                var out = $q.defer()
                out.resolve(envCache[id])
                return out.promise
            }else{
                return $http.get(impURL + 'environment/'+id).then(function(data){ 
    				envCache[data.data.id]=data.data
	    			return data.data;});
            }            
        }

        impAPI.getAgents = function(){
            return $http.get(impURL + 'agent').then(function(data){ 
                var out = []
                data.data.forEach( function(machine){
                    machine.agents.forEach( function(agent){
                       out.push({
                        "name":agent.name,
                        "environment":agent.environment,
                        "last_seen":formatDate(machine.last_seen),
                        "hostname":machine.hostname
                        });
                    });
				});
                return out
            });
        }
		
		impAPI.getVersions = function(env) {
			return $http.get(impURL + 'cmversion',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.forEach(formateVersion)
                    return data.data;});
		};

	    impAPI.getResources = function(env,cmversion) {
			return $http.get(impURL + 'cmversion/'+cmversion,{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data.resources
                });
		};

		

		return impAPI;
});




