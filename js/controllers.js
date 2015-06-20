"use strict";

/* We need a dot in the $scope variable. We cannot just create $scope.contactId and use it
 * with a ng-xx directive, instead we create contactId as a contact property ($scope.contact.contactId).
 *
 * http://zcourts.com/2013/05/31/angularjs-if-you-dont-have-a-dot-youre-doing-it-wrong/
 */

// Define our application module.
var app = angular.module("angularcrud", ["ui.bootstrap", "ngRoute", "ngMessages", "firebase", 'LocalForageModule', 'ajoslin.promise-tracker']);

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
        { "firstname": "Fred", "lastname": "Flintstone" },
        { "firstname": "Wilma", "lastname": "Flintstone" },
        { "firstname": "Barney", "lastname": "Rubble" },
        { "firstname": "Betty", "lastname": "Rubble" }
    ]);

// Offline data storage key used by localForage. This will be the document key in IndexedDB.
app.constant("DATAKEY", "AngularCrudData");

// Called on application start up. We use this to do application setup.
app.run(function ($window, $rootScope, $location, dataFactory) {

    // Function to run when we transition to being online
    function onOnline() {
        $rootScope.$apply(function () {
            // If we were previously offline, push all local changes to the server
            if (!$rootScope.online) {
                dataFactory.updateAllContacts();
                $scope.$apply();
            }
            $rootScope.online = true;
        });
    }

    // Function to run when we transition to being offline
    function onOffline() {
        $rootScope.$apply(function () {
            $rootScope.online = false;
        });
    }

    // Variable containing network status, note we don't (but should) test access to our_data.firebaseio.com
    $rootScope.online = $window.navigator.onLine;

    // Set our on/off line functions as event listeners
    $window.addEventListener("offline", onOffline, false);
    $window.addEventListener("online", onOnline, false);


    // Get the Firebase data URL from localStorage. If this is the first run (or localStorage has been cleared)
    // the returned value will be null. If null the list screen will redirect us to the settings page where it
    // can be set.
    // If key isn't found null is returned
    $rootScope.FBURL = localStorage.getItem("FBURL");
});


/*
 * Controller for the listing page.
 */
app.controller("ListCtrl", function ($scope, $location, dataFactory, DATAKEY, $localForage) {
    // Vars are set at rootScope, $scope will recursively search up to rootScope
    if ($scope.FBURL === null) {
        $location.path("/settings");
    } else {
        dataFactory.getAll(function (data) {
            $scope.contacts = data;

            // Save the retrieved data locally so it's available when we go offline
            if ($scope.online) {
                localforage.setItem(DATAKEY, DATAKEY, function (value) {
                });
                $localForage.setItem(DATAKEY, data);
                //             bind($scope.contacts, data)

            }
            else {
                // We are offline. localForage operations happen outside of Angular's view, tell Angular data changed
                           $localForage.getItem(DATAKEY).then(function (d) {
                              bind($scope.contacts, d);
                           });
                $scope.$apply();
            }
        });

        $scope.savingNewJob = function () {
            console.log('heaysdf')
        }
        $scope.addNewJob = function (jobID) {
            console.log('here '+jobID)
            dataFactory.addJob(jobID)
        }
        // Set our menu tab active and all others inactive
        $("#menu-list").addClass("active");
        $("#menu-new").removeClass("active");
        $("#menu-loaddata").removeClass("active");
        $("#menu-settings").removeClass("active");
    }

});

var ModalInstanceCtrl = function ($scope, $modalInstance, userForm) {
    $scope.form = {}
       $scope.cancel = function () {
        }
    $scope.submitForm = function () {
        if ($scope.form.userForm.$valid) {
            console.log($scope.job.contactId)
            console.log( $scope.form.userForm.name.$modelValue)
             $scope.df.updateJob($scope.job.contactId, $scope.form.userForm.name.$modelValue,
                 $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue, $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue );
            $modalInstance.close('closed');
        } else {

            console.log('userform is not in scope');
        }
    };

    $scope.cancel = function () {
        console.log('just canceled')
        $modalInstance.dismiss('cancel');
    };
};

app.controller("ViewCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $http) {

    dataFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        console.log(data.contactId)
        $scope.formDisabled = false;
        $scope.df = dataFactory;
        //$scope.job.contactId = $routeParams.contactId;
        // We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
        if (!$scope.online) {
            $scope.$apply();
        }

        $scope.showForm = function () {

            var modalInstance = $modal.open({
                templateUrl: 'views/modal-form.html',
                controller: ModalInstanceCtrl,
                scope: $scope,
                resolve: {
                    userForm: function () {
                        return $scope.userForm;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
                //TODO this doesnt feel right
                $location.path('/')
                console.log('returned')
            }, function () {
                    console.info('Modal dismissed at: ' + new Date());
                });
        };


    });

    $("#menu-list").removeClass("active");
    $("#menu-new").removeClass("active");
    $("#menu-loaddata").removeClass("active");
    $("#menu-settings").removeClass("active");
});


/*
 * Controller for the edit page.
 */
// app.controller("EditCtrl", function ($scope, $routeParams, dataFactory) {
//     // Get the object identified by contactId from our data store so we can edit it
//     dataFactory.getById($routeParams.contactId, function (data) {
//         $scope.contact = data;
//         $scope.contact.contactId = $routeParams.contactId;

//         // We are offline. localforage operations happen outside of Angular's view, tell Angular our model has changed
//         if (!$scope.online) {
//             $scope.$apply();
//         }
//     });

//     // Function to run on Delete button click
//     $scope.remove = function () {
//         alert('need to add this modal back')
//         //var message = "Are you sure ?";
//         //
//         //var modalHtml = '<div class="modal-body">' + message + '</div>';
//         //modalHtml += '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-warning" ng-click="cancel()">Cancel</button></div>';
//         //
//         //var modalInstance = $modal.open({
//         //    template: modalHtml,
//         //    controller: ModalInstanceCtrl
//         //});
//         //
//         //modalInstance.result.then(function() {
//         //    dataFactory.delete($scope.contact.contactId);
//         //});
//     };


//     // Function to run on Save button click
//     $scope.save = function () {
//         dataFactory.update($scope.contact.contactId, $scope.contact.firstname, $scope.contact.lastname);
//     };

//     // Set all menu tabs inactive (there isn't a menu tab for editing an existing item)
//     $("#menu-list").removeClass("active");
//     $("#menu-new").removeClass("active");
//     $("#menu-loaddata").removeClass("active");
//     $("#menu-settings").removeClass("active");
// });


/*
 * Controller for the new contact page.
 */
app.controller("NewCtrl", function ($scope, dataFactory) {
    $scope.contact = {}; // Initialize a blank object for the data entry form to use
    console.log('new job creation')
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
    // Set default value to be used for form input field
    if ($scope.FBURL === null) {
        $scope.settings.firebaseurl = "https://andrewscleaning.firebaseio.com/";
    } else {
        $scope.settings.firebaseurl = $scope.FBURL;
    }

    // TODO - Should add a cancel button. We currently leave the user stuck in this screen. They
    // have to click save to get their menus back. That's not friendly.
    $scope.save = function () {
        // Really should test that url is a valid Firebase data url

        // Make sure URL ends with "/"
        if ($scope.settings.firebaseurl.slice(-1) !== "/") {
            $scope.settings.firebaseurl += "/";
        }

        localStorage.setItem("FBURL", $scope.settings.firebaseurl);    // Persist the URL to localStorage for future use
        $rootScope.FBURL = $scope.settings.firebaseurl;                // Set the app runtime URL variable

        // Re-enable other tabs now that we have a URL
        $("#menu-list").removeClass("disabled");
        $("#menu-new").removeClass("disabled");
        $("#menu-loaddata").removeClass("disabled");

        $location.path("/"); // Go to list screen which will load data from the server
    };

    // Disable other menu items until a valid data url is entered and make settings tab active with all others inactive
    $("#menu-list").addClass("disabled").removeClass("active");
    $("#menu-new").addClass("disabled").removeClass("active");
    $("#menu-loaddata").addClass("disabled").removeClass("active");
    $("#menu-settings").addClass("active");
});

