"use strict";

/* We need a dot in the $scope variable. We cannot just create $scope.contactId and use it
 * with a ng-xx directive, instead we create contactId as a contact property ($scope.contact.contactId).
 *
 * http://zcourts.com/2013/05/31/angularjs-if-you-dont-have-a-dot-youre-doing-it-wrong/
 */

// Define our application module.
var app = angular.module("angularcrud", ["ui.bootstrap", "ngRoute", "ngMessages", "firebase", 'LocalForageModule', 'ajoslin.promise-tracker']);

// Configure our applications routing.
app.config(['$routeProvider', function ($routeProvider) {
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
            controller: "ViewJobCtrl",
            templateUrl: "./views/viewJob.html"
        })

        //.when("/view2/:contactId", {
        //    controller: "ViewJobCtrl",
        //    templateUrl: "./views/viewJob.html"
        //})
        .when("/viewJobBasics/:contactId", {
            controller: "ViewJobBasicsCtrl",
            templateUrl: "./views/viewJob-basics.html"
        })
        .when("/viewJobEquipment/:contactId", {
            controller: "ViewJobEquipmentCtrl",
            templateUrl: "./views/viewJob-equipment.html"
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
        {"firstname": "Fred", "lastname": "Flintstone"},
        {"firstname": "Wilma", "lastname": "Flintstone"},
        {"firstname": "Barney", "lastname": "Rubble"},
        {"firstname": "Betty", "lastname": "Rubble"}
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
                //TODO removed this... had to do with local shit, may need to return for something else
                //dataFactory.updateAllContacts();
                // $scope.$apply();
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


        // Set our menu tab active and all others inactive
        $("#menu-list").addClass("active");
        $("#menu-new").removeClass("active");
        $("#menu-loaddata").removeClass("active");
        $("#menu-settings").removeClass("active");
    }
    $scope.addNewJob = function (jobID) {
        //TODO this needs to refresh page after job added
        console.log('here ' + $scope.contacts)
        dataFactory.addJob(jobID, $scope.contacts);
    }

});

app.controller("ViewJobCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
    dataFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        console.log('list length ' + $scope.job.rooms.length)
        //TODO fix json.parse rooms incase room are null it will crash everything down

        $scope.editContactInfo = function () {
            console.log('hi ')
        }
        $scope.editEquipment = function () {
            console.log('hi ')
        }
        $scope.editWork = function () {
            console.log('hi ')
        }
    });
    $scope.deleteJob = function () {
        dataFactory.delete($scope.job.contactId)
    }
    $("#menu-list").removeClass("active");
    $("#menu-new").removeClass("active");
    $("#menu-loaddata").removeClass("active");
    $("#menu-settings").removeClass("active");
});

var ModalInstanceCtrl = function ($scope, $modalInstance, userForm, $route) {
    $scope.form = {}
    $scope.cancel = function () {
    }

    $scope.addRoom = function (room) {
        if (room.$modelValue) {
            if ($scope.job.rooms.indexOf(room.$modelValue) > -1) {
                console.log('room existed not adding ')
                return;
            }
            $scope.job.rooms.push(room.$modelValue)
            //userForm.$invalid = false;
            console.log('pushed a room ' + room.$modelValue)
        }
    }

    $scope.removeRoom = function (room) {
        console.log('removing  ' + room.$modelValue)

        $scope.job.rooms.splice($scope.job.rooms.indexOf(room), 1);
    }
    $scope.submitForm = function () {
        //TODO this entire jobstartdate shit is hacky as fuck

        if ($scope.form.userForm.$valid) {
            if ($scope.form.userForm.startDate.$modelValue) {
                $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
                    $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
                    $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue,
                    $scope.form.userForm.startDate.$modelValue, $scope.job.rooms, $scope.job.dayList);
                $modalInstance.close('closed');
                return;
            }
            //if (!$scope.form.userForm.startDate.$modelValue && $scope.job.oldStartDate) {
            //    console.log('going to scope 2  ' +$scope.job.rooms )
            //
            //    $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
            //        $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
            //        $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue,
            //        $scope.job.oldStartDate, $scope.job.rooms);
            //    $modalInstance.close('closed');
            //    return;
            //}
            if (!$scope.form.userForm.startDate.$modelValue && !$scope.job.oldStartDate) {
                $modalInstance.close('closed');
                alert('This job needs a start Date')
                return;
            }
            if (!$scope.job.rooms || $scope.job.rooms.length < 1) {
                $modalInstance.close('closed');
                alert('This job needs at least one room')
                return;
            }

        } else {
            $route.reload();

        }
    };

    $scope.cancel = function () {
        console.log('just canceled')
        $modalInstance.dismiss('cancel');
    };
};

var EquipmentInstanceCtrl = function ($scope, $modalInstance, equipmentForm, $route) {
    $scope.form = {}
    $scope.cancel = function () {
        console.log('canceled out ')
    }
    console.log('daynum '+$scope.dayNum);
    if($scope.dayNum == null){
        alert("error: day does not exist.")
        return;
    }
    if (!$scope.job.dayList[$scope.dayNum].fans) {
        $scope.job.dayList[$scope.dayNum].fans = 0;
    }
    if (!$scope.job.dayList[$scope.dayNum].dehus) {
        $scope.job.dayList[$scope.dayNum].dehus = 0;
    }
    $scope.removeFan = function () {

        if ($scope.job.dayList[$scope.dayNum].fans >= 1) {
            $scope.job.dayList[$scope.dayNum].fans -= 1;

        }
    };
    $scope.addFan = function () {
        $scope.job.dayList[$scope.dayNum].fans += 1;

    };

    $scope.removeDehu = function () {

        if ($scope.job.dayList[$scope.dayNum].dehus >= 1) {
            $scope.job.dayList[$scope.dayNum].dehus -= 1;
        }
    };

    $scope.addDehu = function () {
        $scope.job.dayList[$scope.dayNum].dehus += 1;
    };

    $scope.submitForm = function () {
        console.log('room = '+ $scope.currentRoom);
        if ($scope.form.equipmentForm.$valid) {
            $scope.df.updateJobEquipment($scope.job.contactId, $scope.dayNum,
                $scope.currentRoom,
                $scope.job.dayList[$scope.dayNum].fans,
                $scope.job.dayList[$scope.dayNum].dehus
            )
        }

        else {
            $route.reload();

        }
    };

    $scope.cancel = function () {
        console.log('just canceled')
        $modalInstance.dismiss('cancel');
    };
};
var DayInstanceCtrl = function ($scope, $modalInstance, day1Form, $route) {
    $scope.form = {}
    $scope.cancel = function () {
    }

    $scope.addRoom = function (room) {
        if (room.$modelValue) {
            if ($scope.job.rooms.indexOf(room.$modelValue) > -1) {
                console.log('room existed not adding ')
                return;
            }
            $scope.job.rooms.push(room.$modelValue)
            //userForm.$invalid = false;
            console.log('pushed a room ' + room.$modelValue)
        }
    }

    $scope.removeRoom = function (room) {
        console.log('removing  ' + room.$modelValue)

        $scope.job.rooms.splice($scope.job.rooms.indexOf(room), 1);
    }
    $scope.submitForm = function () {
        //TODO this entire jobstartdate shit is hacky as fuck
        if ($scope.form.userForm.$valid) {
            if ($scope.form.userForm.startDate.$modelValue) {
                console.log('asdf ' + $scope.job.dayList)

                $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
                    $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
                    $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue,
                    $scope.form.userForm.startDate.$modelValue, $scope.job.rooms, $scope.job.dayList);
                $modalInstance.close('closed');
                return;
            }
            //if (!$scope.form.userForm.startDate.$modelValue && $scope.job.oldStartDate) {
            //    console.log('going to scope 2  ' +$scope.job.rooms )
            //
            //    $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
            //        $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
            //        $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue,
            //        $scope.job.oldStartDate, $scope.job.rooms);
            //    $modalInstance.close('closed');
            //    return;
            //}
            if (!$scope.form.userForm.startDate.$modelValue && !$scope.job.oldStartDate) {
                $modalInstance.close('closed');
                alert('This job needs a start Date')
                return;
            }
            if (!$scope.job.rooms || $scope.job.rooms.length < 1) {
                $modalInstance.close('closed');
                alert('This job needs at least one room')
                return;
            }

        } else {
            $route.reload();

        }
    };

    $scope.cancel = function () {
        console.log('just canceled')
        $modalInstance.dismiss('cancel');
    };
};


app.controller("ViewJobBasicsCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
    dataFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        //TODO fix json.parse rooms incase room are null it will crash everything down
        if ($scope.job.rooms) {

            //$scope.job.rooms = JSON.parse(data.rooms)
        } else {
            console.log('got noes rooms ')
            $scope.job.rooms = new Array();

        }
        if (!$scope.job.rooms) {
            $scope.job.rooms = new Array();
        }
        //TODO make a jobStartDate pretty object to show
        $scope.job.oldStartDate = $scope.job.startDate;

        if (!$scope.job.startDate) {
            $scope.day1Show = false;

        } else {
            $scope.day1Show = true;
        }
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

app.controller("ViewJobEquipmentCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
    dataFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        $scope.showFields = false;

        $scope.changedValue = function (room) {
            $scope.showFields = true;
            $scope.currentRoom = room;
        }


        $scope.df = dataFactory;

        if (!$scope.online) {
            $scope.$apply();
        }

        $scope.showForm = function (day) {
console.log('day = '+day);
            $scope.dayNum = day;
            $scope.showFields = false;


            var modalInstance = $modal.open({
                templateUrl: 'views/editequipment-form.html',
                controller: EquipmentInstanceCtrl,
                scope: $scope,
                resolve: {
                    equipmentForm: function () {
                        return $scope.equipmentForm;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
                //TODO this doesnt feel right
                $location.path('/')
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

app.controller("ViewCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
    dataFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        //TODO fix json.parse rooms incase room are null it will crash everything down
        if ($scope.job.rooms) {

            //$scope.job.rooms = JSON.parse(data.rooms)
        } else {
            console.log('got noes rooms ')
            $scope.job.rooms = new Array();

        }
        if (!$scope.job.rooms) {
            $scope.job.rooms = new Array();
        }
        //TODO make a jobStartDate pretty object to show
        $scope.job.oldStartDate = $scope.job.startDate;

        if (!$scope.job.startDate) {
            $scope.day1Show = false;

        } else {
            $scope.day1Show = true;
        }
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
            }, function () {
                console.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.showDay = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/day-form.html',
                controller: DayInstanceCtrl,
                scope: $scope,
                resolve: {
                    dayForm: function () {
                        return $scope.dayForm;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
                //TODO this doesnt feel right
                $location.path('/')
            }, function () {
                console.info('Day modal dismissed at: ' + new Date());
            });
        };

        $scope.addDay = function () {

            var date = new Date($scope.job.dayList.slice(-1)[0].date);//gets last date in array
            date.setDate(date.getDate() + 1);//adds a day
            var newDay = {};
            newDay.date = date;

            $scope.job.dayList.push(newDay);
            $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.job.account.accountName,
                $scope.job.account.address1, $scope.job.account.phone1,
                $scope.job.account.phone2, $scope.job.account.email,
                $scope.job.startDate, $scope.job.rooms, $scope.job.dayList);
        };

    });

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
    //TODO may need to put back in ?
    //fireFactory.updateAllContacts(SAMPLEDATA);
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




