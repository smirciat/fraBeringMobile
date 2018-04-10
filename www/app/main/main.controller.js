'use strict';

angular.module('workspaceApp')
  .controller('MainController',function($http, $scope,$mdDialog,$mdSidenav,$timeout,appConfig,$interval,moment) {
      var self=this;
      self.tempPilot={name:""};
      if (window.localStorage.getItem('pilot')!==null&&window.localStorage.getItem('pilot')!=='undefined') self.tempPilot=JSON.parse(window.localStorage.getItem('pilot'));
      self.$http = $http;
      self.interval=$interval;
      self.scope=$scope;
      self.mdDialog=$mdDialog;
      self.mdSidenav=$mdSidenav;
      self.timeout=$timeout;
      self.appConfig=appConfig;
      self.moment=moment;
      self.api=appConfig.api;
      self.localAssessments=[];
      self.apiPassword="";
      
      self.promptForPassword=function(){
        var confirm = self.mdDialog.prompt()
            .parent(angular.element(document.body))
            .title('What is the passwordr?')
            .textContent('You only need to enter this once per device.  The device will remember until the password is changed.')
            .placeholder('password')
            .ariaLabel('password')
            .initialValue('')
            .required(true)
            .ok('Store')
            .cancel('Cancel');
            
        self.mdDialog.show(confirm).then(function(result) {
          window.localStorage.setItem('api',result);
          self.apiPassword=result;
        });
      };
      
      if (window.localStorage.getItem( 'api' )===null||window.localStorage.getItem( 'api' )==="undefined"){
        self.promptForPassword();
      }
      else self.apiPassword=window.localStorage.getItem( 'api' );
      if (window.localStorage.getItem( 'assessments' )===null||window.localStorage.getItem( 'assessments' )==="undefined"){
        window.localStorage.setItem('assessments',JSON.stringify([]));
      }
      else self.localAssessments=JSON.parse(window.localStorage.getItem( 'assessments' ));
      
      
    
    self.scrapeStorage=function(){
      window.localStorage.setItem( 'assessments', JSON.stringify(self.localAssessments) );
      if (Array.isArray(self.localAssessments)) {
        self.localAssessments.forEach(function(assessment,index){
          self.$http.post(self.api+'/api/assessments/mobile', assessment)
            .then(function(response){//success
              index=self.localAssessments.indexOf(assessment);
              self.localAssessments.splice(index,1);
              window.localStorage.setItem( 'assessments', JSON.stringify(self.localAssessments) );
            },
            function(response){//fail
              
            });
        });
      }
    };
    
    self.initPilots=function(){
      self.$http.get(self.api+'/api/pilots/mobile')
        .then(function(response) {
          self.pilots = response.data;
          self.timeout(function(){
            if (self.assessment.pilot===""||self.assessment.pilot===undefined) self.assessment.pilot=angular.copy(self.tempPilot);
          },1000);
          window.localStorage.setItem('pilots',JSON.stringify(self.pilots));
        },function(response){
          self.pilots=JSON.parse(window.localStorage.getItem('pilots'));
          self.timeout(function(){
            if (self.assessment.pilot===""||self.assessment.pilot===undefined) self.assessment.pilot=angular.copy(self.tempPilot);
          },1000);
        });
    };
    
    self.initAssessment=function(){
      
      var airports,pilot,flight,equipment,color,night,times;
      if (self.assessment) {
        pilot=self.assessment.pilot||"";
        flight=self.assessment.flight||"";
        airports=self.assessment.airports||[];
        equipment=self.assessment.equipment||{id:1,name:"Caravan",wind:35,temp:-50};
        color=self.assessment.color||[];
        night=self.assessment.night||[];
        times=self.assessment.times||[];
      }
      else airports=[];
      self.assessment={metars:[],tafs:[],visibilities:[],ceilings:[],windGusts:[],night:night,times:times,
        windDirections:[],runwayConditions:[],freezingPrecipitations:[], airports:airports, pilot:pilot,flight:flight,equipment:equipment,color:color
      };
      if (self.assessment.pilot===""||self.assessment.pilot===undefined) self.initPilots();
    }
    
    self.initNight=function(airport,index){
      
      var year = self.moment().year();
      var month = self.moment().month()+1;
      var day = self.moment().date();
      var date = year + '-' + month + '-' + day;
      self.assessment.night[index]=false;
      var airportParams = self.getAirport(airport);
      self.$http.get('https://api.sunrise-sunset.org/json?lat=' + airportParams.latitude + '&lng=' + airportParams.longitude + '&date=' + date + '&formatted=0').then(function(response){
        if (response.data.results.civil_twilight_begin==='1970-01-01T00:00:01+00:00') return;
        var twilightStart = self.moment(response.data.results.civil_twilight_begin);
        var twilightEnd = self.moment(response.data.results.civil_twilight_end);
        if (self.assessment.times.length<=index||self.assessment.times[index]==="") return;
        var timeArr=self.assessment.times[index].split(':');
        if (timeArr.length<2) return;
        var departTime = self.moment(twilightStart).startOf('day').hour(timeArr[0]).minute(timeArr[1]);
        if (departTime.isBetween(twilightStart,twilightEnd)) self.assessment.night[index]=false;
        else self.assessment.night[index]=true;
      });  
    }
    
    self.initAirport=function(airport,index,count) {
      count++;
      
      self.assessment.color[index]="md-green";
      self.assessment.metars[index]="";
      self.assessment.tafs[index]="";
      //lookup if airport is at night
      self.initNight(airport,index);
      if (airport.length<3) return;
      self.$http.get('https://avwx.rest/api/metar/' + airport).then(function(response){
        if (response.data.Error) return;
        
        if ((response.data.Temperature*9/5+32)<self.assessment.equipment.temp) {
            var alert = self.mdDialog.alert({
            title: 'Caution',
            textContent: 'Check the temperature, it may be too cold for this aircraft',
            ok: 'Close'
          });
    
          self.mdDialog
            .show( alert )
            .finally(function() {
              alert = undefined;
            }); 
        }
        self.assessment.metars[index]=response.data['Raw-Report'];
        var len = response.data['Cloud-List'].length;
        if (len===0) self.assessment.ceilings[index]='10000';
        else if (len>-1&&(response.data['Cloud-List'][0][0]==='BKN'||response.data['Cloud-List'][0][0]==='OVC'||response.data['Cloud-List'][0][0]==='VV')) self.assessment.ceilings[index]=response.data['Cloud-List'][0][1]+'00';
        else if (len>=2&&(response.data['Cloud-List'][1][0]==='BKN'||response.data['Cloud-List'][1][0]==='OVC'||response.data['Cloud-List'][0][0]==='VV')) self.assessment.ceilings[index]=response.data['Cloud-List'][1][1]+'00';
        else if (len>=3&&(response.data['Cloud-List'][2][0]==='BKN'||response.data['Cloud-List'][2][0]==='OVC'||response.data['Cloud-List'][0][0]==='VV')) self.assessment.ceilings[index]=response.data['Cloud-List'][2][1]+'00';
        else if (len>=4&&(response.data['Cloud-List'][3][0]==='BKN'||response.data['Cloud-List'][3][0]==='OVC'||response.data['Cloud-List'][0][0]==='VV')) self.assessment.ceilings[index]=response.data['Cloud-List'][3][1]+'00';
        else self.assessment.ceilings[index]='10000';
        self.assessment.ceilings[index] = self.assessment.ceilings[index].replace(/^0+/, '');
        if (response.data['Wind-Gust']==="") self.assessment.windGusts[index]=response.data['Wind-Speed'];
        else self.assessment.windGusts[index]=response.data['Wind-Gust'];
        self.assessment.visibilities[index]=response.data.Visibility;
        if (self.assessment.visibilities[index].includes('/')) {
          var bits = self.assessment.visibilities[index].split("/");
          self.assessment.visibilities[index] = parseInt(bits[0],10)/parseInt(bits[1],10);
        }
        self.assessment.visibilities[index]=parseFloat(self.assessment.visibilities[index]);
        self.$http.post(self.api+'/api/assessments/mobile/lookup',{airport:airport}).then(function(res){
          if (res.data.length>0){
            var i = res.data[0].airports.indexOf(airport);
            if (i>-1) {
             if (res.data[0].runwayConditions[i]) self.assessment.runwayConditions[index]=res.data[0].runwayConditions[i];
              else self.assessment.runwayConditions[index]=5;
            }
            else self.assessment.runwayConditions[index]=5;
          }
          else self.assessment.runwayConditions[index]=5;
        });
        self.assessment.freezingPrecipitations[index]=false;
        if (response.data['Other-List'].length>0) {
          response.data['Other-List'].forEach(function(item){
            var i=item.replace(/[^a-zA-Z]/g, "");
            if (i.substring(0,2)==="FZ") self.assessment.freezingPrecipitations[index]=true;
          });
        }
      },function(response){
        if (response.status===500){
          self.timeout(function(){
            if (count<6) self.initAirport(airport,index,count);
          },20000);
        }
        else self.assessment.metars[index]="";
      });
      if (airport.toUpperCase()=="PAOM"||airport.toUpperCase()=="PAOT"||
          airport.toUpperCase()=="PAUN"||airport.toUpperCase()=="PANC"||airport.toUpperCase()=="PAGA") {
        self.$http.get('https://avwx.rest/api/taf/' + airport).then(function(response){
          if (response.data.Error) { 
            self.airports[index]=self.airportsCopy[index];
            return;
          }
          self.assessment.tafs[index]=response.data['Raw-Report'];
        },function(response){
            if (response.status===500){
            if (count<6) self.timeout(self.initAirport(airport,index),20000);
          }
          else self.assessment.tafs[index]="";
        });
      }
    }
    
    self.init=function(){
      
      self.$http.get(self.api+'/api/flights/mobile')
        .then(function(response) {
          self.flights = response.data;
          window.localStorage.setItem('flights',JSON.stringify(self.flights));
        },function(response){
          self.flights=JSON.parse(window.localStorage.getItem('flights'));
        });
        
      self.initPilots();
        
      self.$http.get(self.api+'/api/airportRequirements/mobile')
        .then(function(response) {
          self.airports=response.data;
          window.localStorage.setItem('airports',JSON.stringify(self.airports));
        },function(response){
          self.airports=JSON.parse(window.localStorage.getItem('airports'));
        });
      //self.flights=self.appConfig.flights;
      //self.pilots=self.appConfig.pilots;
      self.initAssessment();
      //self.airports=self.appConfig.airportRequirements;
      self.equipment=self.appConfig.equipment;
    }
    
    self.changeFlight=function(ev) {
      self.timeout(function(){
      
        if (!self.assessment.flight||self.assessment.flight==="") return;
      // Appending dialog to document.body to cover sidenav in docs app
      // Modal dialogs should fully cover application
      // to prevent interaction outside of dialog
        if (self.assessment.flight==="Extra") {
          //unlisted flight number
          
          var confirm = self.mdDialog.prompt()
              .parent(angular.element(document.body))
              .title('What is the new flight number?')
              .textContent('Enter a three or four digit flight number.')
              .placeholder('Flight Number')
              .ariaLabel('Flight Number')
              .initialValue('')
              .targetEvent(ev)
              .required(true)
              .ok('OK')
              .cancel('Cancel');
              
          self.mdDialog.show(confirm).then(function(result) {
            var newFlight={flightNum:result};
            var flightArr=self.flights.filter(function(flight){
              return flight.flightNum===result.slice(-3);
            });
            if (flightArr.length>0) {
              newFlight=JSON.parse(JSON.stringify(flightArr[0]));
              newFlight.flightNum=result;
              self.assessment.times=flightArr[0].departTimes;
            }
            else {
              newFlight={};
              newFlight.flightNum=result;
              if (result.substring(0,1)==='5') newFlight.airports=['PAOT'];
              else if (result.substring(0,1)==='7') newFlight.airports=['PAOM'];
                  else newFlight.airports=[];
              newFlight.departTimes=[self.moment().format('HH:mm').toString()];
            }
            self.flights.push(newFlight);
            self.assessment.flight =  result;
            flightArr = self.flights.filter(function(flt){
              return self.assessment.flight===flt.flightNum;
            });
            if (flightArr.length>0) {
              self.assessment.airports=JSON.parse(JSON.stringify(flightArr[0].airports));
              self.assessment.times=flightArr[0].departTimes;
            }
            self.initAssessment();
            self.assessment.airports.forEach(function(airport,index){
              self.initAirport(airport,index,0);
            });
          }, function() {
            self.assessment.flight = "";
          });
        }
        else {
          var flightArr = self.flights.filter(function(flt){
            return self.assessment.flight===flt.flightNum;
          });
          if (flightArr.length>0) {
            self.assessment.airports=JSON.parse(JSON.stringify(flightArr[0].airports));
            self.assessment.times=flightArr[0].departTimes;
          }
          self.initAssessment();
          self.assessment.airports.forEach(function(airport,index){
            self.initAirport(airport,index,0);
          });
        }
      },400);
      
    };
    
    self.changeAirport=function(ev,index){
      self.timeout(function(){
      
        var time=self.mdDialog.prompt({clickOutsideToClose: true,multiple:true})
          .parent(angular.element(document.body))
          .title('What is the new departure time for self airport?')
          .textContent('Enter a departure time in 24 hour time format')
          .placeholder('16:00')
          .ariaLabel('Time')
          .initialValue(self.assessment.times[index])
          .targetEvent(ev)
          .required(true)
          .ok('Update Depart Time')
          .cancel('Change Airport or Cancel');
          
        var airport = self.mdDialog.prompt({clickOutsideToClose: true,multiple:true})
          .parent(angular.element(document.body))
          .title('What is the new airport?')
          .textContent('Enter a four letter airport code')
          .placeholder('Airport')
          .ariaLabel('Airport')
          .initialValue('')
          .targetEvent(ev)
          .required(true)
          .ok('Update Airport Code')
          .cancel('Cancel');
            
        self.mdDialog.show(time).then(function(result) {
          if (result!=="") {
            self.assessment.times[index] = result;
            self.initNight(self.assessment.airports[index],index);
          }
        },function(){
          self.mdDialog.show(airport).then(function(result) {
            if (result.length===4){
              self.assessment.airports[index]=result;
              self.initAirport(result,index,0);
            }
          });
        });
      },400);
    }
    
    self.changeParam=function(ev,index,param,title){
      self.timeout(function(){
      
        var confirm = self.mdDialog.prompt({clickOutsideToClose: true})
          .parent(angular.element(document.body))
          .title('What is the ' + title + ' for ' + self.assessment.airports[index]  + '?')
          .textContent('Enter ' + title)
          .placeholder(title)
          .ariaLabel(title)
          .initialValue('')
          .targetEvent(ev)
          .required(true)
          .ok('OK')
          .cancel('Cancel');
            
        self.mdDialog.show(confirm).then(function(result) {
          if (result.length!==""){
            self.assessment.color[index]="md-green";
            self.assessment[param][index]=result;
          }
        });
      },400);
    }
    
    self.changeFreezing=function(ev,index){
      self.timeout(function(){
      
        var confirm = self.mdDialog.confirm({clickOutsideToClose: true})
          .parent(angular.element(document.body))
          .title('Is there Freezing Precipitation for ' + self.assessment.airports[index]  + '?')
          .textContent('Tap True or False')
          .ariaLabel('Freezing Precipitation')
          .targetEvent(ev)
          .ok('True')
          .cancel('False');
            
        self.mdDialog.show(confirm).then(function() {
            self.assessment.color[index]="md-red";
            self.assessment.freezingPrecipitations[index]=true;
        },function(){
            self.assessment.color[index]="md-green";
            self.assessment.freezingPrecipitations[index]=false;
        });
      },400);
    };
    
    self.addAirport=function(ev){
      self.timeout(function(){
        var confirm = self.mdDialog.prompt({clickOutsideToClose: true})
          .parent(angular.element(document.body))
          .title('What is the new airport?')
          .textContent('Enter a four letter airport code')
          .placeholder('Airport')
          .ariaLabel('Airport')
          .initialValue('')
          .targetEvent(ev)
          .required(true)
          .ok('OK')
          .cancel('Cancel');
            
        self.mdDialog.show(confirm).then(function(result) {
          if (result.length===4){
            self.assessment.airports.push(result);
            self.assessment.color.push('md-green');
            self.assessment.times.push(self.moment().format('HH:mm').toString());
            self.initAirport(result,self.assessment.airports.length-1,0);
          }
        });
      },400);
    }
    
    self.openChangeMenu=function(mdMenu,ev){
      
      self.timeout(function(){mdMenu.open(ev)},300);
    }
    
    self.getAirport=function(icao){
      
      var airportsArr = self.airports.filter(function(airport){
        return airport.icao.toLowerCase()===icao.toLowerCase();
      });
      if (airportsArr.length>0) return airportsArr[0];
      else return {icao:icao,name:icao,visibilityRequirement:{"yellow":3,"red":0.5,"ifr":2,"night":5},ceilingRequirement:{"yellow":1000,"red":280,"ifr":1000,"night":3000}};
    }
    
    self.airportClass=function(index){
      
      if (self.assessment.metars[index]==="") return "md-blue";
      return "md-green";
    }
    
    self.red=function(i){
      
      self.assessment.color[i]='md-red';
      return 'md-red';
    }
    
    self.yellow=function(i){
      
      if (self.assessment.color[i]!=='md-red') self.assessment.color[i]='md-yellow';
      return 'md-yellow';
    }
    
    self.orange=function(i){
      
      if (self.assessment.color[i]!=='md-red'&&self.assessment.color[i]!=='md-yellow') self.assessment.color[i]='md-orange';
      return 'md-orange';
    };
    
    self.green=function(i){
      
      if (self.assessment.color[i]!=='md-red'&&self.assessment.color[i]!=='md-yellow'&&self.assessment.color[i]!=='md-orange') 
         self.assessment.color[i]='md-green';
      return 'md-green';
    };
    
    self.blue=function(i){
      return 'md-blue';
    };
    
    self.visibilityClass=function(index){
      
      var airport = self.getAirport(self.assessment.airports[index]);
      if (!self.assessment.visibilities[index]) return self.blue(index);
      if (airport.visibilityRequirement.red>self.assessment.visibilities[index]) return self.red(index);
      if (airport.visibilityRequirement.yellow>self.assessment.visibilities[index]) return self.yellow(index);
      if (self.assessment.night[index]) {
        if (airport.visibilityRequirement.night>self.assessment.visibilities[index]) return self.orange(index);
      }
      else {
        if (airport.visibilityRequirement.ifr>self.assessment.visibilities[index]) return self.orange(index);
      }
      
      return self.green(index);
    }
    
    self.ceilingClass=function(index){
      
      var airport = self.getAirport(self.assessment.airports[index]);
      if (!self.assessment.ceilings[index]) return self.blue(index);
      if (airport.ceilingRequirement.red>self.assessment.ceilings[index]) return self.red(index);
      if (airport.ceilingRequirement.yellow>self.assessment.ceilings[index]) return self.yellow(index);
      if (self.assessment.night[index]) {
        if (airport.ceilingRequirement.night>self.assessment.ceilings[index]) return self.orange(index);
      }
      else {
        if (airport.ceilingRequirement.ifr>self.assessment.ceilings[index]) return self.orange(index);
      }
      
      return self.green(index);
    }
    
    self.runwayClass=function(index){
      
      if (self.assessment.runwayConditions[index]<2) return self.red(index);
      if (self.assessment.runwayConditions[index]<4) return self.yellow(index);
      return self.green(index);
    }
    
    self.windClass=function(index){
      
      if (!self.assessment.windGusts[index]) return self.blue(index);
      if (self.assessment.windGusts[index]>self.assessment.equipment.wind) return self.red(index);
      return self.green(index);
    }
    
    self.freezingClass=function(index){
      
      if (self.assessment.freezingPrecipitations[index]) return self.red(index);
      return self.green(index);
    }
    
    self.tafClass=function(index){
      
      if (self.assessment.tafs[index]!=="") return self.green(index);
      return "md-blue";
    }
    
    self.nightClass=function(index){
      
      if (self.assessment.night[index]) return "night";
      else return "day";
    }
    
    self.submit=function(ev){
      self.timeout(function(){
      
        self.assessment.equipment=self.assessment.equipment.name;
        if (!self.assessment||
               !self.assessment.pilot||
               !self.assessment.pilot.name||
               !self.assessment.flight||
               !self.assessment.equipment||
               self.assessment.pilot.name===""||
               self.assessment.flight===""||
               self.assessment.equipment==="") {
          var alert = self.mdDialog.alert({
            title: 'Attention',
            textContent: 'You need to enter a pilot, an aircraft, and a flight number at the top of the page.',
            ok: 'Close'
          });
              
          self.mdDialog.show(alert).then(function() {
            
          });
        }
        else {
          self.assessment.pilot=self.assessment.pilot.name;
          var matchPilots = self.pilots.filter(function(pilot){
            return pilot.name===self.assessment.pilot;
          });
          if (matchPilots.length>0) {
            self.assessment.level=matchPilots[0].level;
          }
          else self.assessment.level="level1";
          self.assessment.date=new Date();
          self.assessment.departTimes=self.assessment.times;
          self.assessment.password=self.apiPassword;
          self.$http.post(self.api+'/api/assessments/mobile', self.assessment)
            .then(function(response){
              self.assessment={};
              self.initAssessment();
            },
            function(response){
              if (response.status===501) self.promptForPassword();
              else {
                self.localAssessments.push(self.assessment);
                window.localStorage.setItem( 'assessments', JSON.stringify(self.localAssessments) );
                self.assessment={};
                self.initAssessment();
              }
            }
          );
          
        }
      },400);
    }
    
    self.checkNotifications=function(ev){
      self.timeout(function(){
      
        if (!self.assessment.pilot) return;
        self.tempPilot=angular.copy(self.assessment.pilot);
        window.localStorage.setItem('pilot',JSON.stringify(self.assessment.pilot));
        self.$http.post(self.api+'/api/notifications/mobile/pilot',{pilot:self.assessment.pilot.name,password:self.apiPassword}).then(function(response){
          console.log(response.data);
          var notifications=response.data;
          var length=notifications.length;
          var count=0;
          var confirm=[];
          notifications.forEach(function(notification,index){
            confirm[index] = self.mdDialog.confirm({clickOutsideToClose:true,multiple:true})
                  .title(notifications[index].title
                      + '   :::   '
                      + 'Notification from ' + notifications[index].creator + ', created on ' 
                      + self.moment(notifications[index].createdAt).format('ddd, MMM Do YYYY, h:mm:ss a'))
                  .textContent(notifications[index].notification)
                  .ariaLabel('Notification')
                  .targetEvent(ev)
                  .ok('I have read and understood this notification')
                  .cancel('Remind me later');
          });
          
          var showAnother = function(){
            if (length>0) self.mdDialog.show(confirm[count]).then(function() {
              notifications[count].notified.push(self.assessment.pilot.name);
              self.$http.put(self.api+'/api/notifications/mobile/'+notifications[count]._id, notifications[count]);
              count++;
              length--;
              showAnother();
            },function(){
              //do something if user declines to read notification
            });
          };
          
          showAnother();
          
        },function(response){
            if (response.status===501) self.promptForPassword();
          });
      },400);
      
    }
    
    self.toggleMenu=function(){
      self.timeout(function(){
        self.mdSidenav('left').toggle();
      },400);
    }
    
    self.pixelRatio=function(ratio){
      if (Math.floor(window.devicePixelRatio)===ratio) return true;
      if (window.devicePixelRatio>3&&ratio===3) return true;
      if (window.devicePixelRatio<1&&ratio===1) return true;
      return false;
    }
    
    self.checkPilot=function(name){
      return name===self.tempPilot.name;
    };

  
      self.scrapeStorage();
          $interval(function(){
            self.scrapeStorage();
          },1800000);//each 30 minutes
      
      self.init();
    
  }
);
