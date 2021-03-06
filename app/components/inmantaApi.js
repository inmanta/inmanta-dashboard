'use strict';

var inmantaApi = angular.module('inmantaApi', ['inmantaApi.config']);

function formatDate(d) {
    if (d === "") {
        return d;
    }
    if (!d) {
        return null;
    }
    return new Date(d);
}

function formatParameter(d) {
    d["updated"] = formatDate(d["updated"]);
}

function formatCompileReports(d) {
    d.forEach(function (d) {
        d["completed"] = formatDate(d["completed"]);
        d["started"] = formatDate(d["started"]);
    });
}

function formateVersion(d) {
    d["date"] = formatDate(d["date"]);
}

inmantaApi.service('authService', ["inmantaConfig", function Nodeservice(inmantaConfig) {
    var api = {};

    if (inmantaConfig.auth && inmantaConfig.auth.realm) {
        // keycloak
        api.keycloak = Keycloak(inmantaConfig.auth);
        api.keycloak.init({flow: 'implicit'});
        api.logout = api.keycloak.logout;
        api.login = api.keycloak.login;
        api.authn = false;

        try {
            if (api.keycloak.isTokenExpired()) {
                api.authn = false;
                api.username = null;
                api.userinfo = null;
            } else {
                api.authn = true;
            }
        } catch (error) {
            api.authn = false;
        }
        api.keycloak.loadUserInfo().success(function (userInfo) {
            api.username = userInfo.preferred_username;
            api.userinfo = userInfo;
        });
        api.enabled = true;
    } else{
        api.enabled = false;
    }
    return api;
}]);


inmantaApi.service('inmantaService', ["$http", "inmantaConfig", "$q", "$cacheFactory", "$rootScope", "alertService", function Nodeservice($http, inmantaConfig, $q, $cacheFactory, $rootScope, alertService) {
    var inmantaAPI = {};
    var impURL = inmantaConfig.backend + "api/v1/";
    var envCache = {};
    var projCache = {};
    //dirty hack to work around https://github.com/angular/angular.js/issues/5028
    var lastEnv = "";

    var lcmURL;
    if (inmantaConfig.lcm) {
        lcmURL = inmantaConfig.lcm + "api/";
    } else {
        lcmURL = null;
    }

    var checkEnv = function (env) {
        if (env != lastEnv) {
            defaultCache.removeAll();
            lastEnv = env;
        }
    };

    var defaultCache = $cacheFactory("http-service-cache");
    $http.defaults.cache = defaultCache;

    $rootScope.$on("refresh", function () {
        defaultCache.removeAll();
    });

    //utilities
    var idRegEx = /([a-zA-Z0-9:_-]+)\[([^,]+),([^=]+)=([^\]]+)\](,v=(\d+))?/;

    function parseID(id) {
        var o = idRegEx.exec(id)
        if (!o) {
            alertService.add("info", "Report to dev: Bad ID received: " + id)
        }
        return {
            "agent_name": o[2],
            "version": o[5],
            "entity_type": o[1],
            "attribute": o[3],
            "attribute_value": o[4]
        }
    }

    inmantaAPI.parseID = parseID;

    inmantaAPI.getConsoleAvailable = function () { 
        return $http.get("/console").then(function(response) {
		    return response.status !== 404;
        });
    };

    //project
    inmantaAPI.getProjects = function () {
        return $http.get(impURL + 'project').then(function (data) {
            data.data.projects.forEach(function (d) { projCache[d.id] = d })
            return data.data.projects;
        });
    };

    inmantaAPI.getProjectsAndEnvironments = function () {
        return $q.all({ projects: inmantaAPI.getProjects(), envs: inmantaAPI.getEnvironments() }).then(
            function (d) {
                var projects = angular.copy(d.projects);
                var proI = {};
                projects.forEach(function (d) { proI[d.id] = d; d.envs = [] })
                angular.copy(d.envs).forEach(function (d) { proI[d.project].envs.push(d) })
                return projects;
            }
        );
    };

    inmantaAPI.getProject = function (project_id) {
        if (projCache[project_id]) {
            var out = $q.defer();
            out.resolve(projCache[project_id]);
            return out.promise;
        } else {
            return $http.get(impURL + 'project/' + project_id).then(function (data) {
                projCache[data.data.project.id] = data.data.project;
                return data.data.project;
            });
        }
    };

    inmantaAPI.addProject = function (name) {
        return $http.put(impURL + 'project', { 'name': name }).then(function (data) {
            defaultCache.removeAll();
            return data.data.project;
        });
    };

    inmantaAPI.removeProject = function (id) {
        return $http.delete(impURL + 'project/' + id);
    };

    inmantaAPI.decommission = function (id) {
        return $http.post(impURL + 'decommission/' + id);
    };

    inmantaAPI.clearEnv = function (id) {
        return $http.delete(impURL + 'decommission/' + id);
    };

    //environment
    inmantaAPI.addEnvironment = function (projectid, name, repo_url, repo_branch) {
        return $http.put(impURL + 'environment', { 'project_id': projectid, 'name': name, 'repository': repo_url, 'branch': repo_branch }).then(function (data) { return data.data.environment; });
    };

    inmantaAPI.clone = function (envid, name) {
        return inmantaAPI.getEnvironment(envid).then(function (env) {
            return inmantaAPI.addEnvironment(env.project, name, env.repo_url, env.repo_branch);
        })
    }

    inmantaAPI.editEnvironment = function (env) {
        return $http.post(impURL + 'environment/' + env.id, { 'id': env.id, 'name': env.name, 'repository': env.repo_url, 'branch': env.repo_branch }).then(function (data) {
            envCache[env.id] = data.data.environment;
            return data.data.environment;
        });
    }

    inmantaAPI.removeEnvironment = function (envid) {
        return $http.delete(impURL + 'environment/' + envid);
    };

    inmantaAPI.getEnvironments = function () {
        return $http.get(impURL + 'environment').then(function (data) {
            data.data.environments.forEach(function (d) { envCache[d.id] = d })
            return data.data.environments;
        });
    };

    inmantaAPI.getEnvironmentsByProject = function (project_id) {
        return inmantaAPI.getEnvironments().then(function (data) {
            var out = [];
            data.forEach(function (env) {
                if (env.project == project_id) {
                    out.push(env);
                }
            })
            return out;
        });

    }

    inmantaAPI.getEnvironmentsWithProject = function () {
        return $q.all({ projects: inmantaAPI.getProjects(), envs: inmantaAPI.getEnvironments() }).then(
            function (d) {
                var projects = d.projects;
                var proI = {};
                projects.forEach(function (d) { proI[d.id] = d })
                var envs = angular.copy(d.envs)
                envs.forEach(function (d) { d['project_full'] = proI[d.project] })
                return envs;
            }
        )
    }

    inmantaAPI.getEnvironment = function (id) {
        if (envCache[id]) {
            var out = $q.defer()
            out.resolve(envCache[id])
            return out.promise
        } else {
            return $http.get(impURL + 'environment/' + id).then(function (data) {
                envCache[data.data.environment.id] = data.data.environment
                return data.data.environment;
            });
        }
    }

    //agent
    inmantaAPI.getAgentProcs = function () {
        return $http.get(impURL + 'agentproc').then(function (data) {

            data.data.processes.forEach(function (proc) {
                proc.first_seen = formatDate(proc.first_seen)
                proc.last_seen = formatDate(proc.last_seen)
                proc.expired = formatDate(proc.expired)
            });
            return data.data.processes
        });
    }

    inmantaAPI.getAgentProcess = function (env, id) {
        return $http.get(impURL + 'agentproc?environment=' + env).then(
            function (data) {
                var out = null
                data.data.processes.forEach(function (proc) {
                    proc.endpoints.forEach(function (ep) {
                        if (ep.id == id)
                        { out = proc }
                    });
                });
                return out
            });
    }

    inmantaAPI.getAgentprocDetais = function (procid) {
        return $http.get(impURL + 'agentproc/' + procid).then(function (data) {
            return data.data
        });
    };

    inmantaAPI.getAgents = function (env) {
        return $http.get(impURL + 'agent', { headers: { "X-Inmanta-tid": env } }).then(function (data) {

            data.data.agents.forEach(function (agent) {
                agent.last_failover = formatDate(agent.last_failover)
            });
            return data.data.agents
        });
    };

    inmantaAPI.agent_action = function (env, agent_name, action) {
        var agent_action_url = inmantaConfig.backend + "api/v2/agent/" + agent_name + "/" + action;
        return $http.post(agent_action_url, {}, { headers: { "X-Inmanta-tid": env } }).then(
            function () {
                $rootScope.$broadcast('refresh');
            });
    };

    //resources
    inmantaAPI.getVersions = function (env) {
        checkEnv(env)
        return $http.get(impURL + 'version', { headers: { "X-Inmanta-tid": env } }).then(
            function (data) {
                data.data.versions.forEach(formateVersion)
                return data.data;
            });
    };

    inmantaAPI.deleteVersion = function (env, version) {
        return $http.delete(impURL + 'version/' + version, { headers: { "X-Inmanta-tid": env } })
    };

    inmantaAPI.getVersionsPaged = function (env, from, count) {
        checkEnv(env)
        return $http.get(impURL + 'version?start=' + from + '&limit=' + count, { headers: { "X-Inmanta-tid": env } })
            .then(
            function (data) {
                data.data.versions.forEach(formateVersion)
                return data.data;
            });
    };

    inmantaAPI.getResources = function (env, version) {
        checkEnv(env)
        return $http.get(impURL + 'version/' + version, { headers: { "X-Inmanta-tid": env } }).then(
            function (data) {
                return data.data
            });
    };

    inmantaAPI.getResourcesState = function (env) {
        checkEnv(env)
        return $http.get(impURL + 'environment/' + env + '?resources=1&versions=5').then(
            function (data) {
                return data.data.environment
            });
    }
    //resource has version in id!
    inmantaAPI.getResource = function (env, id) {
        checkEnv(env)
        return $http.get(impURL + 'resource/' + window.encodeURIComponent(id) + "?logs=true", { headers: { 'X-Inmanta-tid': env } }).then(
            function (data) {
                return data.data.resource
            });
    };

    inmantaAPI.getUnkownsForEnv = function (env) {
        return inmantaAPI.getVersions(env).then(function (f) {
            if (!f.versions || f.versions.length == 0) {
                return []
            }
            return inmantaAPI.getResources(env, f.versions[0].version).then(function (f) {
                return f.unknowns
            })
        })
    }
    //parameters
    inmantaAPI.getParameters = function (env, query) {
        if (query === undefined) {
            query = {};
        }
        checkEnv(env)
        return $http.post(impURL + 'parameter', query, { headers: { "X-Inmanta-tid": env } }).then(
            function (data) {
                data.data.parameters.forEach(formatParameter);
                data.data.now = formatDate(data.data.now)
                return data.data
            });
    };

    inmantaAPI.getReportParameters = function (env) {
        checkEnv(env)
        return inmantaAPI.getParameters(env).then(function (f) {
            return f.parameters.filter(function (v) {
                return v.metadata && v.metadata.type == "report"
            })
        });
    };

    inmantaAPI.getParameter = function (env, name, resource) {
        checkEnv(env)
        return $http.get(impURL + 'parameter/' + window.encodeURIComponent(name) + "?resource_id=" + window.encodeURIComponent(resource), { headers: { "X-Inmanta-tid": env } }).then(
            function (data) {
                formatParameter(data.data.parameter);
                return data.data.parameter
            });
    };

    inmantaAPI.deleteParameter = function(env, name, resource_id) {
        checkEnv(env)
        var deleteParameterUrl = impURL + 'parameter/' + window.encodeURIComponent(name);
        if (resource_id) {
            deleteParameterUrl += "?resource_id=" + window.encodeURIComponent(resource_id);
        }
        return $http.delete(deleteParameterUrl, { headers: { "X-Inmanta-tid": env } }).then(
            function (data) {
                console.log(data);
            },
            function (data) {
                alert("The server does not support deleting parameters. Please upgrade.");
            });
    };

    //deploy
    inmantaAPI.deploy = function (env, version, push) {
        return $http.post(impURL + 'version/' + version, { 'push': push }, { headers: { 'X-Inmanta-tid': env } }).then(
            function (data) {
                return data.data;
            });
    };

    function formatAction(action) {
        action["timestamp"] = formatDate(action["timestamp"]);
        return action
    }

    //dryrun
    function formatDryrunShort(d) {
        d["date"] = formatDate(d["date"]);
    }

    function formatDryruns(d) {
        d.forEach(formatDryrunShort);
    }

    function formatDryrun(d) {
        d["date"] = formatDate(d["date"]);
        for (var k in d.resources) {
            d.resources[k]["id_fields"] = parseID(k)
        }

    }

    inmantaAPI.dryrun = function (env, version) {
        checkEnv(env)
        return $http.post(impURL + 'dryrun/' + version, {}, { headers: { 'X-Inmanta-tid': env } }).then(
            function (data) {
                formatDryrun(data.data.dryrun);
                return data.data.dryrun;
            });
    };

    inmantaAPI.getDryruns = function (env, version) {
        checkEnv(env)
        if (version) {
            return $http.get(impURL + 'dryrun?version=' + version, { headers: { 'X-Inmanta-tid': env } }).then(
                function (data) {
                    formatDryruns(data.data.dryruns)
                    return data.data.dryruns;
                });
        } else {
            return $http.get(impURL + 'dryrun', { headers: { 'X-Inmanta-tid': env } }).then(
                function (data) {
                    formatDryruns(data.data.dryruns)
                    return data.data.dryruns;
                });
        }

    };

    inmantaAPI.getDryrun = function (env, id) {
        checkEnv(env)
        return $http.get(impURL + 'dryrun/' + window.encodeURIComponent(id), { headers: { 'X-Inmanta-tid': env } }).then(
            function (data) {
                formatDryrun(data.data.dryrun)
                return data.data.dryrun;
            });
    }

    //files
    inmantaAPI.getFile = function (id) {

        return $http.get(impURL + 'file/' + window.encodeURIComponent(id)).then(
            function (data) {
                data.data.content = window.atob(data.data.content)
                return data.data;
            });
    };

    inmantaAPI.downloadFile = function (id) {
        window.open(impURL + 'file/' + window.encodeURIComponent(id))
    };

    inmantaAPI.getDiff = function (h1, h2) {
        return $http.post(impURL + 'filediff', { a: h1, b: h2 }).then(
            function (data) {
                return data.data;
            });
    };
    //logs
    inmantaAPI.getLogForResource = function (env, id) {
        checkEnv(env)
        return $http.get(impURL + 'resource/' + window.encodeURIComponent(id) + "?logs=true", { headers: { 'X-Inmanta-tid': env } }).then(
            function (data) {
                return data.data;
            });
    };

    inmantaAPI.sendFeedback = function (feedback) {
        // return TODO
        // DUMMY CODE
        var out = $q.defer();
        out.resolve(null);
        return out.promise;
    };

    // compile
    inmantaAPI.compile = function (env, update) {
        update = (typeof update !== 'undefined') ?  update : false;
        var metadata = {
            "message": "Compile triggerd from the dashboard",
            "type": "dashboard"
        };
        return $http.post(impURL + 'notify/' + env, {update: update, metadata: metadata});
    };

    inmantaAPI.updateCompile = function (env) {
        return inmantaAPI.compile(env, true);
    };

    inmantaAPI.isCompiling = function (env) {
        return $http.head(impURL + 'notify/' + env).then(function (d) {
            if (d.status == 200) {
                return true;
            } else {
                return false;
            }
        });
    };

    inmantaAPI.getCompileReports = function (env) {
        return $http.get(impURL + 'compilereport', {headers: {'X-Inmanta-tid': env}}).then(function (data) {
            formatCompileReports(data.data.reports);
            return data.data.reports;
        });
    };

    inmantaAPI.getReport = function (compile_id) {
        return $http.get(impURL + 'compilereport/' + compile_id).then(function (data) {
            formatCompileReports([data.data.report]);
            formatCompileReports(data.data.report.reports);
            return data.data.report;
        });
    };

    // settings
    inmantaAPI.getSettings = function (env) {
        return $http.get(impURL + 'environment_settings', {headers: {'X-Inmanta-tid': env}}).then(
            function (data) {
                return data.data;
            });
    };

    inmantaAPI.setSetting = function (env, key, value) {
        return $http.post(impURL + 'environment_settings/' + key, {"value": value}, {headers: { 'X-Inmanta-tid': env }}).then(
            function (data) {
                return data.data;
            });
    };

    inmantaAPI.deleteSetting = function (env, key) {
        return $http.delete(impURL + 'environment_settings/' + key, {headers: { 'X-Inmanta-tid': env }}).then(
            function (data) {
                return data.data;
            });
    };

    inmantaAPI.createToken = function (env, client_types) {
        return $http.post(impURL + 'environment_auth', {"client_types": client_types}, {headers: { 'X-Inmanta-tid': env }}).then(
            function (data) {
                return data.data;
            });
    };

    inmantaAPI.trigger_deploy = function (env, agent_trigger_method, agents) {
        return $http.post(
            impURL + "deploy",
            { "agent_trigger_method": agent_trigger_method, "agents": agents },
            { headers: { 'X-Inmanta-tid': env } }
        ).then(
            function (data) {
                return data.data;
            }
        );
    };

    inmantaAPI.getServerStatus = function () {
        return $http.get(
            impURL + "serverstatus"
        ).then(
            function(response) {
                return response.data.data;
            }
        )
    };

    inmantaAPI.getCompileQueue = function (env) {
        return $http.get(
            impURL + "compilequeue",
            { headers: { 'X-Inmanta-tid': env } }
        ).then(
            function(response) {
                angular.forEach(response.data.queue, function(el) {
                    el.requested = formatDate(el.requested);
                    el.started = formatDate(el.started);
                });

                return response.data;
            }
        )
    };    

    inmantaAPI.haltEnvironment = function(env) {
        return $http.post(
            inmantaConfig.backend + "api/v2/actions/environment/halt",
            {},
            { headers: { 'X-Inmanta-tid': env } }
        );
    };

    inmantaAPI.resumeEnvironment = function(env) {
        return $http.post(
            inmantaConfig.backend + "api/v2/actions/environment/resume",
            {},
            { headers: { 'X-Inmanta-tid': env } }
        );
    };

    if (lcmURL) {
        inmantaAPI.getLCMServices = function (env) {
            return $http.get(lcmURL + 'service_types', {headers: { 'X-Inmanta-tid': env }}).then(
                function (data) {
                    return data.data;
                }
            );
        }

        inmantaAPI.getLCMServiceInstances = function (env, service_type) {
            return $http.get(lcmURL + 'services/' + service_type + "?model_state=inactive", {headers: { 'X-Inmanta-tid': env }}).then(
                function (data) {
                    return data.data;
                }
            );
        }

        inmantaAPI.getEvents = function (env, service_type, instance_id) {
            return $http.get(lcmURL + 'services/' + service_type + "/" + instance_id + "/events", {headers: { 'X-Inmanta-tid': env }}).then(
                function (data) {
                    return data.data;
                }
            );
        }
        inmantaAPI.getServiceResources = function (env, service_type, instance_id) {
            return $http.get(lcmURL + 'services/' + service_type + "/" + instance_id + "/resources", {headers: { 'X-Inmanta-tid': env }}).then(
                function (data) {
                    return data.data;
                }
            );
        }
    }
    return inmantaAPI;
}
]);
