"use strict";

/* We need a dot in the $scope variable. We cannot just create $scope.contactId and use it
 * with a ng-xx directive, instead we create contactId as a contact property ($scope.contact.contactId).
 *
 * http://zcourts.com/2013/05/31/angularjs-if-you-dont-have-a-dot-youre-doing-it-wrong/
 */

// Define our application module.
var app = angular.module("angularcrud", ["ngRoute", "ngMessages", "firebase"]);

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

      .when("/settings", {
         controller: "SettingsCtrl",
         templateUrl: "./views/settings.html"
      })

      .otherwise({
         redirectTo: "/"
      });
}]);


// Initial angularcrud data. This will be used by the reinitialize functionality.
app.constant("SAMPLEDATA",
   [
      {"firstname": "Fred",  "lastname":"Flintstone"},
      {"firstname": "Wilma", "lastname":"Flintstone"},
      {"firstname": "Barney","lastname":"Rubble"},
      {"firstname": "Betty", "lastname":"Rubble"}
   ]);


// Called on application start up. We use this to do application setup.
app.run(function($window, $rootScope, $location, dataFactory) {

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


   // Get the Firebase data URL from localStorage. If this is the first run (or localStorage has been cleared)
   // the returned value will be null. If null the list screen will redirect us to the settings page where it
   // can be set.
   var FBHOST = localStorage.getItem("FBHOST");
   if (typeof FBHOST === "undefined" || FBHOST === null) {
      $rootScope.FBHOST = "https://YOUR_HOSTNAME.firebaseio.com/";
      $rootScope.FBURL = "";
   } else {
      $rootScope.FBHOST = FBHOST;
      $rootScope.FBURL = FBHOST;
   }

});


/*
 * Controller for the listing page.
 */
app.controller("ListCtrl", function ($scope, $location, dataFactory) {
   // Vars are set at rootScope, $scope will recursively search up to rootScope
   if ($scope.FBHOST === "" || $scope.FBURL === "") {
      $location.path("/settings");
   } else {
      dataFactory.getAll(function (data) {
         $scope.contacts = data;

         // Save the retrieved data locally so it's available when we go offline
         if ($scope.online) {
            localforage.setItem($scope.FBURL, data, function(value) {
               // Do other things once the value has been saved.
               // console.log(value);
            });
         }
         else {
            // We are offline. localForage operations happen outside of Angular's view, tell Angular data changed
            $scope.$apply();
         }
      });

      // Set our menu tab active and all others inactive
      $("#menu-list").addClass("active");
      $("#menu-new").removeClass("active");
      $("#menu-loaddata").removeClass("active");
      $("#menu-settings").removeClass("active");
   }

});


/*
 * Controller for the view details page.
 */
app.controller("ViewCtrl", function ($scope, $location, $routeParams, dataFactory) {
   // Get the object identified by contactId from our data store so we can edit it
   dataFactory.getById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      // We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
      if (!$scope.online) {
         $scope.$apply();
      }
   });

   // Function to run on Delete button click
   $scope.remove = function () {
      dataFactory.delete($scope.contact.contactId);
   };

   // Function to run on Edit button click
   $scope.edit = function () {
      $location.path("/edit/" + $scope.contact.contactId);
   };

   // Set all menu tabs inactive (there isn't a menu tab for viewing an items detail)
   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
   $("#menu-loaddata").removeClass("active");
   $("#menu-settings").removeClass("active");
});


/*
 * Controller for the edit page.
 */
app.controller("EditCtrl", function ($scope, $routeParams, dataFactory) {
   // Get the object identified by contactId from our data store so we can edit it
   dataFactory.getById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      // We are offline. localforage operations happen outside of Angular's view, tell Angular our model has changed
      if (!$scope.online) {
         $scope.$apply();
      }
   });

   // Function to run on Delete button click
   $scope.remove = function () {
      dataFactory.delete($scope.contact.contactId);
   };

   // Function to run on Save button click
   $scope.save = function () {
      dataFactory.update($scope.contact.contactId, $scope.contact.firstname, $scope.contact.lastname);
   };

   // Set all menu tabs inactive (there isn't a menu tab for editing an existing item)
   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
   $("#menu-loaddata").removeClass("active");
   $("#menu-settings").removeClass("active");
});


/*
 * Controller for the new contact page.
 */
app.controller("NewCtrl", function ($scope, dataFactory) {
   $scope.contact = {}; // Initialize a blank object for the data entry form to use

   // Function to run on Save button click
   $scope.save = function () {
      dataFactory.add($scope.contact.firstname, $scope.contact.lastname);
   };

   // Set our menu tab active and all others inactive
   $("#menu-list").removeClass("active");
   $("#menu-new").addClass("active");
   $("#menu-loaddata").removeClass("active");
   $("#menu-settings").removeClass("active");
});


/*
 * Controller for reinitializing the database.
 */
app.controller("LoadCtrl", function (SAMPLEDATA, fireFactory) {
   fireFactory.updateAllContacts(SAMPLEDATA);
});


/*
 * Controller for the settings page.
 */
app.controller("SettingsCtrl", function ($scope, $rootScope, $location) {
   $scope.settings = {};
   $scope.settings.firebaseurl = $scope.FBHOST;

   //
   $scope.save = function () {
      // Really should test that url is a valid Firebase data url

      // Make sure URL ends with "/"
      if ($scope.settings.firebaseurl.slice(-1) !== "/") {
         $scope.settings.firebaseurl += "/";
      }

      localStorage.setItem("FBHOST", $scope.settings.firebaseurl);   // Persist the URL to localStorage for future use
      $rootScope.FBURL = $scope.settings.firebaseurl;                // Set the app runtime URL variable

      // Re-enable other tabs now that we have a URL
      $("#menu-list").removeClass("disabled");
      $("#menu-new").removeClass("disabled");
      $("#menu-loaddata").removeClass("disabled");

      $location.path("/"); // Go to list screen which will load data from the server
   };

   // Disable other menu items until a valid data url is entered
   $("#menu-list").addClass("disabled");
   $("#menu-new").addClass("disabled");
   $("#menu-loaddata").addClass("disabled");

   // Make settings tab active and all others inactive
   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
   $("#menu-loaddata").removeClass("active");
   $("#menu-settings").addClass("active");
});
