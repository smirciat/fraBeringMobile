'use strict';

angular.module('workspaceApp')
  .controller('ViewHazardsController',function($http) {
    var self=this;
    $http.get('/api/hazardReports').then(function(response){
      self.hazardReports=response.data;
    });
  
  
  
}

);