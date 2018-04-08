'use strict';

angular.module('workspaceApp')
  .directive('sidebar', function(){
       return {
    templateUrl: 'components/sidebar/sidebar.html',
    restrict: 'E',
    controller: 'SidebarController',
    controllerAs: 'side'
       }
  });

