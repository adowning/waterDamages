"use strict";

/* We need a dot in the $scope variable. We cannot just create $scope.contactId and use it
 * with a ng-xx directive, instead we create contactId as a contact property ($scope.contact.contactId).
 *
 * http://zcourts.com/2013/05/31/angularjs-if-you-dont-have-a-dot-youre-doing-it-wrong/
 */

// Define our application module.
var app = angular.module("angularcrud", ["ngRoute", "firebase"]);

// Configure our applications routing.
app.config(["$routeProvider", function ($routeProvider) {
   $routeProvider
      .when("/", {
         controller: "ListCtrl",
         templateUrl: "./views/list.html"
      })

      .when("/edit/:contactId", {
         controller: "EditCtrl",
         templateUrl: "./views/edit.html"
      })

      .when("/view/:contactId", {
         controller: "ViewCtrl",
         templateUrl: "./views/view.html"
      })

      .when("/new", {
         controller: "NewCtrl",
         templateUrl: "./views/edit.html"
      })

      .when("/load", {
         controller: "LoadCtrl",
         templateUrl: "./views/list.html"
      })

      .otherwise({
         redirectTo: "/"
      });
}]);

// Add your Firebase application URL here.
app.constant("FBURL", "https://jimshea.firebaseio.com/");

// Initial angularcrud data.
app.constant("SAMPLEDATA",
   [
      {"firstname": "Fred",  "lastname":"Flintstone"},
      {"firstname": "Wilma", "lastname":"Flintstone"},
      {"firstname": "Barney","lastname":"Rubble"},
      {"firstname": "Betty", "lastname":"Rubble"}
   ]);


// Called on application start up.
app.run(function($window, $rootScope, dataFactory) {
   // Function to run when we transition to being online
   function onOnline() {
      $rootScope.$apply(function() {
         // If we were previously offline, push all local changes to the server
         if (!$rootScope.online) {
            dataFactory.updateAllContacts();
         }
         $rootScope.online = true;
      });
   }

   // Function to run when we transition to being offline
   function onOffline() {
      $rootScope.$apply(function() {
         $rootScope.online = false;
      });
   }

   // Variable containing network status, note we don't (but should) test access to our_data.firebaseio.com
   $rootScope.online = $window.navigator.onLine;

   // Set our on/off line functions as event listeners
   $window.addEventListener("offline", onOffline, false);
   $window.addEventListener("online",  onOnline,  false);
});


/*
 * Controller for the listing page.
 */
app.controller("ListCtrl", function (FBURL, $scope, dataFactory) {
   dataFactory.getAllContacts(function (data) {
      $scope.contacts = data;

      // Save the retrieved data locally in case we go offline
      if ($scope.online) {
         localforage.setItem(FBURL, data, function(value) {
            // Do other things once the value has been saved.
            // console.log(value);
         });
      }
      else {
         // We are offline. localForage operations happen outside of Angular's view, tell Angular data changed
         $scope.$apply();
      }
   });

   $("#menu-list").addClass("active");
   $("#menu-new").removeClass("active");
});


/*
 * Controller for the view details page.
 */
app.controller("ViewCtrl", function ($scope, $location, $routeParams, dataFactory) {
   dataFactory.getContactById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      // We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
      if (!$scope.online) {
         $scope.$apply();
      }
   });

   $scope.remove = function () {
      dataFactory.removeContactById($scope.contact.contactId);
   };

   $scope.edit = function () {
      $location.path("/edit/" + $scope.contact.contactId);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});


/*
 * Controller for the edit page.
 */
app.controller("EditCtrl", function ($scope, $routeParams, dataFactory) {
   dataFactory.getContactById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      // We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
      if (!$scope.online) {
         $scope.$apply();
      }
   });

   $scope.remove = function () {
      dataFactory.removeContactById($scope.contact.contactId);
   };

   $scope.save = function () {
      dataFactory.updateNameById($scope.contact.contactId, $scope.contact.firstname, $scope.contact.lastname);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});


/*
 * Controller for the new contact page.
 */
app.controller("NewCtrl", function ($scope, dataFactory) {
   $scope.contact = {};

   $scope.save = function () {
      dataFactory.saveNewName($scope.contact.firstname, $scope.contact.lastname);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").addClass("active");
});


/*
 * Controller for reinitializing the database.
 */
app.controller("LoadCtrl", function (SAMPLEDATA, fireService) {
   fireService.initializeData(SAMPLEDATA);
});
