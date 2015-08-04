'use strict';

angular.module('imperaApi.config',[])
.constant('imperaConfig', {
  'backend': 'http://192.168.104.111:8888/'
});


/* jasmine specs for controllers go here */
describe('Resource Controller', function() {

var scope, $httpBackend;

beforeEach(module('ImperaApp.resourceView'));

beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
    $httpBackend = _$httpBackend_;
   
    
    scope = $rootScope.$new();

    $httpBackend.expectGET('http://192.168.104.111:8888/cmversion/1435695748',{"X-Impera-tid":"a20623b5-8a7c-41d4-911c-85b44ce8e81f","Accept":"application/json, text/plain, */*"}).
        respond({"resources": [{"name": "which", "version": 1435695748, "id": "std::Package[vm1,name=which],v=1435695748", "reload": false, "requires": [], "state": "installed"}], "model": {"date": "2015-06-30T22:22:28.067000", "environment": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", "version": 1435695748, "release_status": "DEPLOY"}});
    $controller('resourceController', {$scope: scope,$stateParams:{env:"a20623b5-8a7c-41d4-911c-85b44ce8e81f",version:"1435695748"}});
     
    $httpBackend.flush();
  }));

 it('should set fields', function() {
 
  expect(scope.resources).toEqual([{"name": "which", "version": 1435695748, "id": "std::Package[vm1,name=which],v=1435695748", "reload": false, "requires": [], "state": "installed"}]);


 });
})

