'use strict';

/**
 * Removes server error when user updates input
 */
angular.module('workspaceApp')
  .directive('mongooseError', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
             element.on('keydown', function() {ngModel.$setValidity('mongoose', true);});
      }
    };
  });
