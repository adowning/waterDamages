"use strict";

var app = angular.module("angularcrud", ["ngFileUpload", "angularSpinner", "ui.bootstrap", "ngRoute", "ngMessages", "firebase", 'LocalForageModule', 'ajoslin.promise-tracker']);

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
            controller: "ListCtrl",
            templateUrl: "./views/list.html"
        })

        .otherwise({
            redirectTo: "/"
        });
}]);
app.constant('_', window._);
app.constant("moment", moment);
app.constant("GMaps", GMaps);
app.constant("DATAKEY", "AngularCrudData");
//app.constant("Spinner", Spinner);

app.run(function ($window, $rootScope, $location, fireFactory) {

    // Function to run when we transition to being online
    function onOnline() {
        $rootScope.$apply(function () {
            // If we were previously offline, push all local changes to the server
            //if (!$rootScope.online) {
            //    $rootScope.online = false;
            //}
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
    $rootScope.FBURL = "https://andrewscleaning.firebaseio.com/"
    // Set our on/off line functions as event listeners
    $window.addEventListener("offline", onOffline, false);
    $window.addEventListener("online", onOnline, false);

    // Get the Firebase data URL from localStorage. If this is the first run (or localStorage has been cleared)
    // the returned value will be null. If null the list screen will redirect us to the settings page where it
    // can be set.
    // If key isn't found null is returned
    //$rootScope.FBURL = localStorage.getItem("FBURL");
});

app.filter('active', function () {
    return function (sItem) {
        console.log('sItem' + sItem.onSite)
        if (!sItem.onSite) {
            return sItem.id;
        } else {

        }
    };
});

app.controller("ListCtrl", function ($scope, usSpinnerService,  $route, moment, GMaps, $location, DATAKEY, $localForage, fireFactory) {
    // Vars are set at rootScope, $scope will recursively search up to rootScope
    $scope.loading = true;
    usSpinnerService.spin('spinner-1');

    if ($scope.FBURL === null) {
        $location.path("/settings");
    } else {
        var map = {};


        fireFactory.getShopEquipment(function (data) {
            $scope.company = data;

            $scope.changeSelectedEquipmentToEdit = function (equip) {
                $scope.selectedEquipmentToEdit = equip;

                var m = new moment($scope.selectedEquipmentToEdit.purchaseDate.value)

                $scope.purchaseDate = {
                    value: new Date(m.format('YYYY, MM, DD').toString())
                };

                $scope.selectionIdBeforeChange = equip.id;
            }

            $scope.equipTypes = [
                {type: 'fan'},
                {type: 'dehu'},
                {type: 'other'}
            ];
            $scope.equipStatus = [
                {status: 'Active'},
                {status: 'Broken'},
                {status: 'Lost'}
            ];

            $scope.adding = false;

            $scope.delete = function () {
                console.log('deleting ' + $scope.selectionIdBeforeChange);
                for (var i = 0; i < $scope.company.shop.length; i++) {
                    if ($scope.company.shop[i].id === $scope.selectionIdBeforeChange) {
                        $scope.company.shop.splice(i, 1);
                    }
                }
                fireFactory.updateShopEquipment(
                    $scope.company.shop
                )
                var millisecondsToWait = 1500;
                setTimeout(function () {
                    $route.reload();

                }, millisecondsToWait);

            }
            $scope.add = function () {
                $scope.selectedEquipmentToEdit = {};
                $scope.adding = true;
            }
            $scope.addingEquipment = function (asdf) {
                //console.log('adding ' + $scope.selectedEquipmentToEdit.id);
                $scope.equipmentBeingAdded = asdf;
                var m = new moment($scope.equipmentBeingAdded.purchaseDate.value)

                $scope.purchaseDate = {
                    value: new Date(m.format('YYYY, MM, DD').toString())
                };
                console.log('asdf' + asdf)
            }
            $scope.cancel = function () {
                console.log('canceling ');
                $route.reload();

            }

            $scope.submit = function () {
                if ($scope.equipmentBeingAdded) {
                    var newEquipment = {};
                    newEquipment.id = $scope.equipmentBeingAdded.id.$viewValue;
                    newEquipment.purchaseDate = {}
                    newEquipment.purchaseDate.value = $scope.equipmentBeingAdded.purchaseDate.$viewValue;
                    newEquipment.type = $scope.equipmentBeingAdded.type.$viewValue;
                    newEquipment.model = $scope.equipmentBeingAdded.model.$viewValue;
                    newEquipment.status = $scope.equipmentBeingAdded.status.$viewValue;

                    var tempDate = new moment($scope.equipmentBeingAdded.purchaseDate.$viewValue)
                    newEquipment.prettyPurchaseDate = tempDate.format('MM/DD/YYYY');
                    $scope.company.shop.push(newEquipment)

                    if ($scope.equipmentBeingAdded.id.$viewValue && $scope.equipmentBeingAdded.type.$viewValue &&
                        $scope.equipmentBeingAdded.model.$viewValue
                        && $scope.equipmentBeingAdded.purchaseDate.$viewValue && $scope.equipmentBeingAdded.status.$viewValue) {
                        fireFactory.updateShopEquipment(
                            $scope.company.shop
                        )
                        var millisecondsToWait = 1500;
                        setTimeout(function () {
                            $route.reload();

                        }, millisecondsToWait);

                    } else {
                        alert('Error: Not all equipment information was filled out, please redo form.')
                        return;
                    }
                    return;
                }
                if ($scope.selectedEquipmentToEdit) {
                    $scope.selectedEquipmentToEdit.purchaseDate.value = $scope.purchaseDate.value;

                    var tempDate = new moment($scope.purchaseDate.value)
                    $scope.selectedEquipmentToEdit.prettyPurchaseDate = tempDate.format('MM/DD/YYYY');

                    if ($scope.selectedEquipmentToEdit.purchaseDate.value && $scope.selectedEquipmentToEdit.id &&
                        $scope.selectedEquipmentToEdit.type
                        && $scope.selectedEquipmentToEdit.model && $scope.selectedEquipmentToEdit.status) {
                        fireFactory.updateShopEquipment(
                            $scope.company.shop
                        )
                        var millisecondsToWait = 1500;
                        setTimeout(function () {
                            $route.reload();

                        }, millisecondsToWait);

                    } else {
                        alert('Error: Not all equipment information was filled out, please redo form.')
                    }
                }
            };
            var tempArray = [];
            var shopFans = [];
            var shopDehus = [];
            if (data.shop) {
                for (var i = 0; i < data.shop.length; i++) {
                    if (data.shop[i]) {
                        if (data.shop[i].type == 'fan' && data.shop[i].status == "Active") {
                            shopFans.push(data.shop[i].id)
                        }
                        if (data.shop[i].type == 'dehu' && data.shop[i].status == "Active") {
                            shopDehus.push(data.shop[i].id)

                        }
                        var tempDate = new moment(data.shop[i].purchaseDate)
                        data.shop[i].prettyDate = tempDate.format('MM/DD/YYYY');
                        tempArray.push(data.shop[i]);
                    }
                }
                $scope.loading = false;
            }
            $scope.shopFans = shopFans;
            $scope.shopDehus = shopDehus;
            $scope.company.shop = tempArray;
        });
        fireFactory.getAll(function (data) {

            map = new GMaps({
                div: '#map',
                height: '400px',
                width: '550px',
                zoom: 12,
                lat: 32.311730,
                lng: -95.264658
            });

            var fansTotal = 0;
            var dehusTotal = 0;
            var addresses = [];

            for (var job in data) {
                var dehuList = [];
                var fanList = [];
                var object = data[job];
                var dayList = object.dayList;
                if (dayList) {
                    for (var i = 0; i < dayList.length; i++) {
                        var theseRooms = dayList[i].rooms;
                        for (var y = 0; y < theseRooms.length; y++) {
                            var equipmentList = theseRooms[y].equipment;
                            if (equipmentList) {
                                for (var x = 0; x < equipmentList.length; x++) {
                                    var equipment = equipmentList[x];
                                    if (equipment.type == 'dehu') {
                                        dehuList.push(equipment.id)
                                        dehusTotal++;
                                    }
                                    if (equipment.type == 'fan') {
                                        fansTotal++;
                                        fanList.push(equipment.id)
                                    }
                                }
                            }
                        }
                    }
                }
                data[job].fanList = fanList;
                data[job].dehuList = dehuList;

                var d = new Date(data[job].startDate)
                if (tempDate) {
                    var tempDate = new moment(d.toISOString())
                    data[job].prettyStartDate = tempDate.format('MM/DD/YYYY');
                }


                var address = {};
                address.add = data[job].account.address1 + " " + data[job].account.city + ", " + data[job].account.zip;
                address.name = data[job].accountName;
                address.fanList = fanList;
                address.dehuList = dehuList;
                addresses.push(address)

            }
            map.setCenter(32.311730, -95.264658, function (callback) {
            })
            for (var i = 0; i < addresses.length; i++) {
                geoCode(addresses[i], GMaps, map, function () {

                });
            }
            $scope.fansTotal = fansTotal;
            $scope.dehusTotal = dehusTotal;
            $scope.contacts = data;

        });
        $scope.alertMe = function () {
            setTimeout(function () {
                map.refresh();

            });
        };
        // Set our menu tab active and all others inactive
        $("#menu-list").addClass("active");
        $("#menu-new").removeClass("active");
        $("#menu-loaddata").removeClass("active");
        $("#menu-settings").removeClass("active");
    }
    $scope.addNewJob = function (jobID) {
        //TODO this needs to refresh page after job added .. such a fucking hack lol
        console.log('adding new job ' + $scope.contacts)
        fireFactory.addJob(jobID, $scope.contacts);
        var millisecondsToWait = 1500;
        setTimeout(function () {
            $route.reload();

        }, millisecondsToWait);

    }

});

app.controller("ViewJobCtrl", function ($modal, $scope, $location, $routeParams, fireFactory, $filter, $http) {
    fireFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
    });
    $scope.deleteJob = function () {
        console.log('deleting ' + $scope.job)
        var dehus = 0;
        var fans = 0;
        var object = $scope.job;
        var dayList = object.dayList;
        if (dayList) {
            for (var j = 0; j < dayList.length; j++) {
                var theseRooms = dayList[j].rooms;
                for (var y = 0; y < theseRooms.length; y++) {
                    var equipmentList = theseRooms[y].equipment;
                    if (equipmentList) {
                        for (var x = 0; x < equipmentList.length; x++) {
                            var equipment = equipmentList[x];
                            if (equipment.type == 'dehu') {
                                dehus++;
                            }
                            if (equipment.type == 'fan') {
                                fans++;
                            }
                        }
                    }
                }
            }

        }
        if (fans > 0 || dehus > 0) {
            alert('you cannot delete a job that still has equipment on it')
        } else {
            fireFactory.delete($scope.job.contactId)
        }
    }
    $("#menu-list").removeClass("active");
    $("#menu-new").removeClass("active");
    $("#menu-loaddata").removeClass("active");
    $("#menu-settings").removeClass("active");
});

app.controller("ViewJobBasicsCtrl", function ($modal, $scope, $location, $routeParams, fireFactory, $filter, $http) {
    fireFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
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
        $scope.df = fireFactory;
        //$scope.job.contactId = $routeParams.contactId;
        // We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
        //if (!$scope.online) {
        //	$scope.$apply();
        //}

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

app.controller("ViewJobEquipmentCtrl", function ($modal, $scope, $location, $routeParams, fireFactory, $filter, $http) {

    fireFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        $scope.showFields = false;
        $scope.currentRoom = "none";
        $scope.roomChanged = false;

        $scope.changedCurrentRoomValue = function (roomNum) {
            console.log('changed room value')
            $scope.showFields = true;
            var roomObject = $scope.job.dayList[$scope.dayNum].rooms[roomNum]
            $scope.currentRoom = roomObject;
            $scope.currentRoomNum = roomNum;
            $scope.roomChanged = true;
        }

        $scope.df = fireFactory;

        if (!$scope.online) {
            $scope.$apply();
        }

        $scope.showForm = function (day) {
            $scope.dayNum = day;
            $scope.todaysEquipment = $scope.job.dayList[$scope.dayNum];
            $scope.showFields = false;

            $scope.dayToCheckDate = $scope.job.dayList[day].date;

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

        $scope.showLaborForm = function (day) {
            console.log('showing labor')
            $scope.dayNum = day;
            //$scope.todaysEquipment = $scope.job.dayList[$scope.dayNum];
            $scope.showFields = false;

            var modalInstance = $modal.open({
                templateUrl: 'views/editlabor-form.html',
                controller: LaborInstanceCtrl,
                scope: $scope,
                resolve: {
                    laborForm: function () {
                        return $scope.laborForm;
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
        $scope.addDay = function () {

            var date = new moment($scope.job.dayList.slice(-1)[0].date);//gets last date in array
            date.add('days', 1)

            console.log('here' + moment().diff(date))

            if (moment().diff(date) < 0) {
                alert('Cannot add days in the future')
                return;
            }

            var newDay = {};
            newDay.rooms = [];
            newDay.date = date.toString();
            for (var y = 0; y < $scope.job.rooms.length; y++) {
                var thisRoom = {}
                thisRoom.name = $scope.job.rooms[y];
                thisRoom.equipment = [];
                newDay.rooms.push(thisRoom)
            }
            $scope.job.dayList.push(newDay);
            $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.job.account.accountName,
                $scope.job.account.address1, $scope.job.account.phone1,
                $scope.job.account.phone2, $scope.job.account.email, $scope.job.account.city, $scope.job.account.zip,
                $scope.job.startDate, $scope.job.rooms, $scope.job.dayList);
        };

        $scope.upload = function (f) {
            console.log('asdf')
            console.log('$scopcid' + $scope.job.contactId)
            fireFactory.uploadImage($scope.job, f);

        };

        $scope.getImage = function (i) {

            fireFactory.getImage(i, function (data) {
                var image = new Image();
                image.src = data;
                document.body.appendChild(image);
            });

        }

    });


    //now load other jobs so when adding equipment
    //we can see if it is already being used
    fireFactory.getAll(function (data) {
        $scope.allJobs = data;
    });


    $("#menu-list").removeClass("active");
    $("#menu-new").removeClass("active");
    $("#menu-loaddata").removeClass("active");
    $("#menu-settings").removeClass("active");
});

app.controller("ViewCtrl", function ($modal, $scope, $location, $routeParams, fireFactory, $filter, $http) {
    fireFactory.getById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
        if ($scope.job.rooms) {

            //$scope.job.rooms = JSON.parse(data.rooms)
        } else {
            console.log('got noes rooms ')
            $scope.job.rooms = new Array();

        }
        if (!$scope.job.rooms) {
            $scope.job.rooms = new Array();
        }

        $scope.job.oldStartDate = $scope.job.startDate;

        if (!$scope.job.startDate) {
            $scope.day1Show = false;

        } else {
            $scope.day1Show = true;
        }
        $scope.formDisabled = false;
        $scope.df = fireFactory;
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


var ModalInstanceCtrl = function ($scope, $modalInstance, userForm, $route) {
    $scope.form = {}
    $scope.cancel = function () {
    }
    $scope.roomChanged = false;
    var m = new moment($scope.job.startDate)

    $scope.htmlStartDate2 = m.format('yyyy, MM, dd').toString()

    $scope.htmlStartDate = {
        value: new Date(m.format('YYYY, MM, DD').toString())
    };
    $scope.addRoom = function (room) {
        if (room.$modelValue) {
            if ($scope.job.rooms.indexOf(room.$modelValue) > -1) {
                return;
            }
            $scope.job.rooms.push(room.$modelValue)
            $scope.roomChanged = true;
        }
    }

    $scope.removeRoom = function (room) {
        $scope.job.rooms.splice($scope.job.rooms.indexOf(room), 1);
        $scope.roomChanged = true;
    }
    $scope.submitForm = function () {

        if ($scope.form.userForm.$valid) {
            if ($scope.form.userForm.startDate.$modelValue) {
                var sd = new moment($scope.form.userForm.startDate.$modelValue);
                console.log(sd.toString())
                console.table($scope.job.dayList)
                if ($scope.job.dayList) {
                    for (var i = 0; i < $scope.job.dayList.length; i++) {
                        //console.log('daylist = ' + new moment($scope.job.dayList[i].date).toString())
                        var sd = new moment($scope.form.userForm.startDate.$modelValue);

                        var dateToCheck = new moment(sd.add('day', i).toString());
                        //console.log('dtc = ' + dateToCheck.toString())
                        $scope.job.dayList[i].date = dateToCheck.toString();
                    }
                } else {
                    var sd = new moment($scope.form.userForm.startDate.$modelValue);

                }
                var sd = new moment($scope.form.userForm.startDate.$modelValue);
                $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
                    $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
                    $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue, $scope.form.userForm.city.$modelValue,
                    $scope.form.userForm.zip.$modelValue,
                    sd.toString(), $scope.job.rooms, $scope.job.dayList, $scope.roomChanged);
                $modalInstance.close('closed');
                return;
            }
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

var EquipmentInstanceCtrl = function ($scope, fireFactory, $modalInstance, equipmentForm, $route) {
    fireFactory.getShopEquipment(function (data) {
        $scope.showAdd = false;
        $scope.company = data;
        var dateToCheck = $scope.dayToCheckDate;
        var time = new moment().toString();
        var tempArray = [];

        for (var i = 0; i < data.equipment.length; i++) {
            if (data.equipment[i]) {
                tempArray.push(data.equipment[i]);
            }
        }
        //$scope.company.equipment = tempArray;

        var tempArray = [];
        if (data.shop) {
            for (var i = 0; i < data.shop.length; i++) {
                if (data.shop[i]) {
                    tempArray.push(data.shop[i]);
                }
            }
        }

        if (tempArray.length > 0) {
            $scope.showAdd = true;
        }

        for (var job in $scope.allJobs) {
            var thisJob = $scope.allJobs[job];
            if (thisJob.dayList) {
                for (var x = 0; x < thisJob.dayList.length; x++) {
                    var thisDay = thisJob.dayList[x];
                    if (thisDay) {
                        for (var a = thisDay.rooms.length - 1; a >= 0; a--) {
                            if (thisDay.rooms[a]) {
                                if (thisDay.rooms[a].equipment) {
                                    for (var i = thisDay.rooms[a].equipment.length - 1; i >= 0; i--) {
                                        var id = thisDay.rooms[a].equipment[i].id;
                                        var inputDate = new Date(thisDay.date);
                                        var date2Check = new Date(dateToCheck);

                                        if (inputDate.setHours(0, 0, 0, 0) == date2Check.setHours(0, 0, 0, 0)) {
                                            for (var x = 0; x < tempArray.length; x++) {

                                                if (tempArray[x].id == id) {
                                                    tempArray.splice(x, 1)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        $scope.activeEquipmentList = tempArray;
        $scope.form = {}
        $scope.cancel = function () {
            console.log('canceled out ')
        }

        if ($scope.dayNum == null) {
            alert("error: day does not exist.")
            return;
        }
        $scope.removeEquipment = function (equipment) {
            var found = false;
            for (var i = $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.length - 1; i >= 0; i--) {
                if ($scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment[i].id == equipment.id) {
                    $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.splice(i, 1);
                    //var thisDay = $scope.todaysEquipment.date;
                    //var inputDate = new Date(thisDay);
                    //var todaysDate = new Date();
                    //
                    //if (inputDate && todaysDate) {
                    //    if (inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
                    //        //Date equals today's date
                    //        console.log('putting back in shop')
                    //        //$scope.company.shop.push(equipment)
                    //        equipment.onSite = false;
                    //    }
                    //}
                    //
                    //found = true;
                }
            }

            console.log('removing equipment length = ' + $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.length)
        };


        $scope.addEquipment = function (equipment) {

            var found = false;
            for (var a = $scope.todaysEquipment.rooms.length - 1; a >= 0; a--) {

                if (!$scope.todaysEquipment.rooms[a].equipment) {
                    $scope.todaysEquipment.rooms[a].equipment = [];
                }
            }
            var inputDate = null;
            var todaysDate = null;

            for (var job in $scope.allJobs) {
                //console.log('new Date(thisDay.date)' + new Date(thisDay.date))
                var thisJob = $scope.allJobs[job];
                if (thisJob.dayList) {
                    for (var x = 0; x < thisJob.dayList.length; x++) {
                        var thisDay = thisJob.dayList[x];
                        if (thisDay) {
                            for (var a = thisDay.rooms.length - 1; a >= 0; a--) {
                                if (thisDay.rooms[a]) {
                                    if (thisDay.rooms[a].equipment) {
                                        for (var i = thisDay.rooms[a].equipment.length - 1; i >= 0; i--) {


                                            if (thisDay.rooms[a].equipment[i].id == equipment.id) {
                                                inputDate = new Date(thisDay.date);
                                                todaysDate = new Date($scope.todaysEquipment.date);
                                            } else {
                                                console.log('false')
                                            }
                                            if (inputDate && todaysDate) {
                                                if (inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
                                                    found = true;
                                                }
                                            }

                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!found ) {
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.push(equipment);
            } else {
                 alert('this equipment is already being used')
            }
        };
        $scope.changeSelectedEquipmentToAdd = function (equipment) {
            $scope.selectedEquipment = equipment;
        }

        $scope.addLabor = function (labor, value) {
            if (value > 0) {
                labor.value = value;
            } else {
                //TODO give error msg here  back to client
                return;
            }
            for (var a = $scope.todaysEquipment.rooms.length - 1; a >= 0; a--) {

                if (!$scope.todaysEquipment.rooms[a].labor) {
                    $scope.todaysEquipment.rooms[a].labor = [];
                } else {
                    //for(var i = 0; i < $scope.todaysEquipment.rooms[a].labor.length; i++){
                    //    if($scope.todaysEquipment.rooms[a].labor[i].name === labor.name){
                    //        console.log('trying to add labor that already exists' + )
                    //    }
                    //}
                }
            }
            console.log($scope.todaysEquipment.rooms[$scope.currentRoomNum].labor.length)

            $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor.push(labor);

        };
        $scope.removeLabor = function (labor) {
            console.log('asdf')
            for (var a = $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor.length - 1; a >= 0; a--) {
                console.log('x' + $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor[a].name)
                if ($scope.todaysEquipment.rooms[$scope.currentRoomNum].labor[a].name === labor.name) {
                    $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor.splice(a, 1);
                }
                //for(var i = 0; i < $scope.todaysEquipment.rooms[a].labor.length; i++){
                //    var thisName =  $scope.todaysEquipment.rooms[a].labor[i].name;
                //    var nameCheckingFor =  labor.name;
                //    if(thisName === nameCheckingFor){
                //        console.log('match')
                //        $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor.splice(i, 1);
                //
                //    }
                //
                //}
                //if ($scope.todaysEquipment.rooms[a].labor.name === labor.name) {
                //    console.log('sweet removing' + labor.name)
                //}
            }

        };

        $scope.changeSelectedLaborToAdd = function (labor) {
            $scope.selectedLabor = labor;
        }

        $scope.submitForm = function () {
            if ($scope.canceled) {
                $route.reload;
                return;
            }

            fireFactory.updateShopEquipment(
                $scope.company.shop
            )
            $scope.df.updateJobEquipment(
                $scope.job.contactId,
                $scope.currentRoom,
                $scope.currentRoomNum,
                $scope.dayNum,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].fans,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].dehus,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].labor,
                time
            )
            console.log('reloading route')
            //TODO needs fixed, this reloads before the data is updated
            // async bullshit
            //Fucking hack
            var millisecondsToWait = 1500;
            setTimeout(function () {
                $route.reload();

            }, millisecondsToWait);
        };

        $scope.cancel = function () {
            console.log('just canceled')
            $scope.roomChanged = false;
            $scope.canceled = true;
            $modalInstance.dismiss('cancel');
            $route.reload();

        };
    });

};

var LaborInstanceCtrl = function ($scope, fireFactory, $modalInstance, laborForm, $route) {
    fireFactory.getShopEquipment(function (data) {
        $scope.showAdd = false;
        $scope.company = data;
        var time = new moment().toString();
        console.log('time ' + time)
        //TODO something needs to be done about entering company equipment so we dont get nubmers skipped in the array
        //for now...
        //incase we have missing numbers in our array lets not pass them into scope
        var tempArray = [];

        for (var i = 0; i < data.equipment.length; i++) {
            if (data.equipment[i]) {
                tempArray.push(data.equipment[i]);
            }
        }
        $scope.company.equipment = tempArray;

        var tempArray = [];
        if (data.shop) {
            for (var i = 0; i < data.shop.length; i++) {
                if (data.shop[i]) {
                    tempArray.push(data.shop[i]);
                    console.log('pushing ' + data.shop[i].id)
                }
            }
        }

        $scope.company.shop = tempArray;
        if ($scope.company.shop.length > 0) {
            $scope.showAdd = true;
        }

        $scope.form = {}
        $scope.cancel = function () {
            console.log('canceled out ')
        }

        if ($scope.dayNum == null) {
            alert("error: day does not exist.")
            return;
        }
        $scope.removeEquipment = function (equipment) {
            var found = false;
            for (var i = $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.length - 1; i >= 0; i--) {
                if ($scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment[i].id == equipment.id) {
                    $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.splice(i, 1);
                    $scope.company.shop.push(equipment)
                    found = true;
                }
            }
            if (!found) {
                alert("Error: equipment not found")
            }
            console.log('removing equipment length = ' + $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.length)
        };

        $scope.addEquipment = function (equipment) {

            var found = false;
            for (var a = $scope.todaysEquipment.rooms.length - 1; a >= 0; a--) {

                if (!$scope.todaysEquipment.rooms[a].equipment) {
                    $scope.todaysEquipment.rooms[a].equipment = [];
                }
            }
            for (var job in $scope.allJobs) {
                var thisJob = $scope.allJobs[job];
                if (thisJob.dayList) {
                    for (var x = 0; x < thisJob.dayList.length; x++) {
                        var thisDay = thisJob.dayList[x];
                        if (thisDay) {
                            for (var a = thisDay.rooms.length - 1; a >= 0; a--) {
                                if (thisDay.rooms[a]) {
                                    if (thisDay.rooms[a].equipment) {
                                        for (var i = thisDay.rooms[a].equipment.length - 1; i >= 0; i--) {
                                            if (thisDay.rooms[a].equipment[i].id == equipment.id) {
                                                found = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //make sure the equipment is in the shop
            var inShop = false;
            for (var x = 0; x < $scope.company.shop.length; x++) {
                if ($scope.company.shop[x].id == equipment.id) {
                    $scope.company.shop.splice(x, 1);
                    inShop = true;
                }
            }
            if (!found && inShop) {
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.push(equipment);
            } else {
                alert('this equipment is already being used')
            }
            //console.log('ADDING equipment length = ' +
            // $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment.length)

            //remove equipment from shop
        };
        $scope.changeSelectedEquipmentToAdd = function (equipment) {
            $scope.selectedEquipment = equipment;
        }

        $scope.submitForm = function () {
            if ($scope.canceled) {
                $route.reload;
                return;
            }

            fireFactory.updateShopEquipment(
                $scope.company.shop
            )
            $scope.df.updateJobEquipment(
                $scope.job.contactId,
                $scope.currentRoom,
                $scope.currentRoomNum,
                $scope.dayNum,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].fans,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].dehus,
                $scope.todaysEquipment.rooms[$scope.currentRoomNum].equipment,
                time
            )
            console.log('reloading route')
            //TODO needs fixed, this reloads before the data is updated
            // async bullshit
            //Fucking hack
            var millisecondsToWait = 1500;
            setTimeout(function () {
                $route.reload();

            }, millisecondsToWait);
        };

        $scope.cancel = function () {
            console.log('just canceled')
            $scope.roomChanged = false;
            $scope.canceled = true;
            $modalInstance.dismiss('cancel');
            $route.reload();

        };
    });

};

function geoCode(address, GMaps, map, callback) {
    var coords = [];
    var currAddress;
    var currName;
    currAddress = address.add;
    currName = address.name;
    GMaps.geocode({
        'address': currAddress, callback: function (results, status) {
            if (status == 'OK') {
                var latlng = results[0].geometry.location;
                map.addMarker({
                    lat: latlng.lat(),
                    lng: latlng.lng(),
                    infoWindow: {content: "<b>" + currName + "</b>" + "<br>" + address.fanList + "<br>" + address.dehuList}
                });
            }
            else {
                throw('No results found: ' + status);
            }
            callback();
        }
    });

}

