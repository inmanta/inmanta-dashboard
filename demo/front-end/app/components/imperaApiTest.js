'use strict';

angular.module('imperaApi.config',[])
.constant('imperaConfig', {
  'backend': 'http://192.168.104.111:8888/'
})

/* jasmine specs for controllers go here */
describe('IMP Service', function() {

var scope, imperaApi, $httpBackend;

beforeEach(module('imperaApi'));

beforeEach(inject(function(_$httpBackend_, $rootScope, imperaService) {
    $httpBackend = _$httpBackend_;
   
    
    scope = $rootScope.$new();
    imperaApi = imperaService;
  }));

 it('should have one project', function() {
  $httpBackend.expectGET('http://192.168.104.111:8888/project').
        respond([{"name": "demo", "id": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);
  var result;
  imperaApi.getProjects().then(function(returnFromPromise) {
    result = returnFromPromise;
  });
  $httpBackend.flush();
  expect(result).toEqual([{"name": "demo", "id": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);


 });

it('should have one env', function() {
  $httpBackend.expectGET('http://192.168.104.111:8888/environment').
        respond([{"name": "dev", "id": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", "project": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);
  var result;
  imperaApi.getEnvironments().then(function(returnFromPromise) {
    result = returnFromPromise;
  });
  $httpBackend.flush();
  expect(result).toEqual([{"name": "dev", "id": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", "project": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);


 });

 it('should have versions', function() {
  $httpBackend.expectGET('http://192.168.104.111:8888/cmversion',{"X-Impera-tid":"a20623b5-8a7c-41d4-911c-85b44ce8e81f","Accept":"application/json, text/plain, */*"}).
        respond([
    {
        "date": "2015-07-07T15:18:16.296000", 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DRYRUN", 
        "version": 1436275096
    }, 
    {
        "date": "2015-07-07T15:18:02.879000", 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "AVAILABLE", 
        "version": 1436275082
    }, 
    {
        "date": "2015-06-30T22:29:54.573000", 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DEPLOY", 
        "version": 1435696194
    }, 
    {
        "date": "2015-06-30T22:22:28.067000", 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DEPLOY", 
        "version": 1435695748
    }
]);
  var result;
  imperaApi.getVersions("a20623b5-8a7c-41d4-911c-85b44ce8e81f").then(function(returnFromPromise) {
    result = returnFromPromise;
  });
  $httpBackend.flush();
  expect(result).toEqual([
    {
        "date": new Date("2015-07-07T15:18:16.296000"), 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DRYRUN", 
        "version": 1436275096
    }, 
    {
        "date": new Date("2015-07-07T15:18:02.879000"), 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "AVAILABLE", 
        "version": 1436275082
    }, 
    {
        "date": new Date("2015-06-30T22:29:54.573000"), 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DEPLOY", 
        "version": 1435696194
    }, 
    {
        "date": new Date("2015-06-30T22:22:28.067000"), 
        "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", 
        "release_status": "DEPLOY", 
        "version": 1435695748
    }
  ]);


 });


 it('should have resources', function() {
  var data = readJSON("testdata/cmversion.json");
$httpBackend.expectGET('http://192.168.104.111:8888/cmversion/1435695748',{"X-Impera-tid":"a20623b5-8a7c-41d4-911c-85b44ce8e81f","Accept":"application/json, text/plain, */*"}). respond(data);

  var result;
  imperaApi.getResources("a20623b5-8a7c-41d4-911c-85b44ce8e81f","1435695748").then(function(returnFromPromise) {
    result = returnFromPromise;
  });
  $httpBackend.flush();
  expect(result).toEqual(data);
 });

 it('should parse agents', function() {
$httpBackend.expectGET('http://192.168.104.111:8888/agent').
        respond([{
    "agents": [{
        "role": "agent",
        "environment": "6dd3ed28-4a72-49b4-ae7f-6411bb0eec5e",
        "name": "dnetcloud"
    }],
    "last_seen": "2015-08-24T11:10:31.156000",
    "hostname": "impera-server"
}, {
    "agents": [],
    "last_seen": "2015-08-19T20:12:26.179000",
    "hostname": "tripel"
}, {
    "agents": [{
        "role": "agent",
        "environment": "6dd3ed28-4a72-49b4-ae7f-6411bb0eec5e",
        "name": "app1"
    }],
    "last_seen": "2015-08-24T11:10:31.131000",
    "hostname": "app1"
}]);

  var result;
  imperaApi.getAgents().then(function(returnFromPromise) {
    result = returnFromPromise;
  });
  $httpBackend.flush();
  expect(result).toEqual([
    {'name':"dnetcloud",
     "environment": "6dd3ed28-4a72-49b4-ae7f-6411bb0eec5e",
     "last_seen": new Date("2015-08-24T11:10:31.156000"),
     "hostname": "impera-server"
    },{"name": "app1",
     "environment": "6dd3ed28-4a72-49b4-ae7f-6411bb0eec5e",
      "last_seen": new Date("2015-08-24T11:10:31.131000"),
      "hostname": "app1"
    }
 ]);
 });
 


 it("should produce a report", function () {
        
        var data = readJSON("testdata/cmversionAndLogs.json");
        $httpBackend.expectGET('http://192.168.104.111:8888/cmversion/1435695748?include_logs=true',{"X-Impera-tid":"a20623b5-8a7c-41d4-911c-85b44ce8e81f","Accept":"application/json, text/plain, */*"}).respond(data);
        var result;
        imperaApi.getDryRunReport("a20623b5-8a7c-41d4-911c-85b44ce8e81f","1435695748").then(function(d){result=d;})
        $httpBackend.flush();
        expect(result).toEqual({});

 })
});
