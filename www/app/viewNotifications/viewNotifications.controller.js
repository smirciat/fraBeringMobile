'use strict';

angular.module('workspaceApp')
  .controller('ViewNotificationsController',function($http,$mdDialog,$mdSidenav,Auth,appConfig) {
    var self=this;
    self.Auth=Auth;
    self.pilotList=[];
    self.mdDialog=$mdDialog;
    self.mdSidenav=$mdSidenav;
    self.api=appConfig.api;
    self.http=$http;
    $http.get(self.api+'/api/pilots/mobile').then(function(response){
      self.pilots=response.data;
      $http.get(self.api+'/api/notifications/mobile').then(function(response){
        self.notifications=response.data;
        self.notifications.forEach(function(notification){
          if (notification.notified) {
            notification.notified.sort(function(a,b){
              return a.localeCompare(b);
            });
            notification.notifiedString = notification.notified.toString();
            notification.notNotifiedWhole = self.pilots.filter(function(pilot){
              return notification.notified.indexOf(pilot.name)<0;
            });
            notification.notNotified=[];
            notification.notNotifiedWhole.forEach(function(pilot){
              notification.notNotified.push(pilot.name);
            });
            notification.notNotified.sort(function(a,b){
              return a.localeCompare(b);
            });
            notification.notNotifiedString=notification.notNotified.toString();
          }
        });
      });
    });
    
  
  
  self.archive=function(event,notification){
    
    var confirm = self.mdDialog.confirm()
          .title('Would you like to archive this notification?')
          .textContent('Archive notification titled: ' + notification.title)
          .ariaLabel('Archive Notification')
          .targetEvent(event)
          .ok('Confirm Archive')
          .cancel('Cancel');

    self.mdDialog.show(confirm).then(function() {
      var index = self.notifications.indexOf(notification);
      notification.archived=true;
      self.http.put('/api/notifications/'+notification._id,notification).then(function(response){
        self.notifications.splice(index,1);
      });
    }, function() {
      //cancel
    });
  };
  
  self.viewNotified=function(title,notified,event) {
       
       self.pilotList=notified;
       var parentEl = angular.element(document.body);
       self.mdDialog.show({
         parent: parentEl,
         targetEvent: event,
         title:title,
         template:
           '<md-dialog aria-label="List dialog">' +
           '  <h4>{{title}}</h4>'+
           '  <md-dialog-content>'+
           '    <md-list>'+
           '      <md-list-item ng-repeat="pilot in pilotList">'+
           '       <p>{{pilot}}</p>' +
           '      '+
           '    </md-list-item></md-list>'+
           '  </md-dialog-content>' +
           '  <md-dialog-actions>' +
           '    <md-button ng-click="closeDialog()" class="md-primary">' +
           '      Close' +
           '    </md-button>' +
           '  </md-dialog-actions>' +
           '</md-dialog>',
         locals: {
           pilots: self.pilotList,
           title: self.title
         },
         controller: DialogController
      });
      function DialogController($scope, $mdDialog,pilots,title) {
        $scope.pilotList = pilots;
        $scope.title=title;
        $scope.closeDialog = function() {
          $mdDialog.hide();
        };
      }
  };
  
  self.toggleMenu=function(){
      
      self.mdSidenav('left').toggle();
    };
  
}

);