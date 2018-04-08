'use strict';

angular.module('workspaceApp')
  .controller('AirportsController',function($http,appConfig) {
    var self=this;
    self.api=appConfig.api;
    self.http=$http;
    self.newAirport={};
    
  
  self.init=function(){
    
    self.http.get(self.api+'/api/airportRequirements/mobile').then(function(response){
      self.airports=response.data.sort(function(a,b){
        return a.name.localeCompare(b.name);
      });
    });
  };
  
  self.edit=function(airport,index){
    
    self.index=index;
    self.newAirport=angular.copy(airport);
    self.refreshAirport();
  };
  
  self.refreshAirport=function(){
    
    self.newAirport.ceilingRequirementString = JSON.stringify(self.newAirport.ceilingRequirement);
    self.newAirport.visibilityRequirementString = JSON.stringify(self.newAirport.visibilityRequirement);
    self.newAirport.windRequirementString = JSON.stringify(self.newAirport.windRequirement);
  };
  
  self.update=function(airport){
    
    if (airport==="false") airport=false;
    if (airport.ceilingRequirementString) airport.ceilingRequirement = JSON.parse(airport.ceilingRequirementString);
    if (airport.visibilityRequirementString) airport.visibilityRequirement = JSON.parse(airport.visibilityRequirementString);
    if (airport.windRequirementString) airport.windRequirement = JSON.parse(airport.windRequirementString);
    if (airport._id){
      self.http.put(self.api+'/api/airportRequirements/mobile' + airport._id,airport).then(function(){
        self.airports[self.index]=angular.copy(airport);
        self.newAirport={};
      });
    }
    else {
      self.http.post(self.api+'/api/airportRequirements/mobile',airport).then(function(response){
        self.airports[self.airports.length]=response.data;
        self.newAirport={};
      });
    }
  };
  
  self.cancel=function(){
    
    self.newAirport={};
  };
  
  self.init();
}


);
