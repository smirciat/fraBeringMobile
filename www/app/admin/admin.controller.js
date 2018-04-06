'use strict';

angular.module('workspaceApp')
.controller('AdminController', function ($scope,User,$mdDialog,Auth,appConfig,$timeout) {
    // Use the User $resource to fetch all users
    var self=this;
    self.users = User.query();
    self.mdDialog = $mdDialog;
    self.Auth=Auth;
    self.roles = appConfig.userRoles.slice(0);
    self.role={};
    self.role.selected = "user";
    self.sort={};
    self.sort.selected = "email";
    self.sortBy = ["_id","email","name"];
  

  this.newSort=function() {
    self.users=self.users.sort(function(a,b){
      if (self.sort.selected==="_id") return a[self.sort.selected]-b[self.sort.selected];
      else return a[self.sort.selected].localeCompare( b[self.sort.selected]);
    });
  };
  
  this.changeRole=function(user){
    var index;
    self.users.forEach(function(tempUser,i){
      if (user._id===tempUser._id) index = i;
    });
    self.users[index].role = self.role.selected;
    self.Auth.adminChangeRole(user._id,self.role.selected)
      .then(function() {
            var alert = self.mdDialog.alert({
              title: 'Updated',
              textContent: 'Role for ' + user.name + ' id: ' + user._id + ' changed to ' + self.role.selected,
              ok: 'Close'
            });
      
            self.mdDialog
              .show( alert )
              .finally(function() {
                alert = undefined;
              }); 
          })
          .catch(function(err) {
            console.log(err);
          });
  };

  this.delete = function(user) {
    user.$remove();
    this.users.splice(this.users.indexOf(user), 1);
  };
 });
