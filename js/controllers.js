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
			controller:  "ListCtrl",
			templateUrl: "./views/list.html"
		})

		.when("/edit/:contactId", {
			controller:  "EditCtrl",
			templateUrl: "./views/edit.html"
		})

		.when("/view/:contactId", {
			controller:  "ViewJobCtrl",
			templateUrl: "./views/viewJob.html"
		})

		//.when("/view2/:contactId", {
		//    controller: "ViewJobCtrl",
		//    templateUrl: "./views/viewJob.html"
		//})
		.when("/viewJobBasics/:contactId", {
			controller:  "ViewJobBasicsCtrl",
			templateUrl: "./views/viewJob-basics.html"
		})
		.when("/viewJobEquipment/:contactId", {
			controller:  "ViewJobEquipmentCtrl",
			templateUrl: "./views/viewJob-equipment.html"
		})
		.when("/new", {
			controller:  "NewCtrl",
			templateUrl: "./views/edit.html"
		})

		.when("/load", {
			controller:  "LoadCtrl",
			templateUrl: "./views/list.html"
		})

		.when("/settings", {
			controller:  "SettingsCtrl",
			templateUrl: "./views/settings.html"
		})

		.otherwise({
			redirectTo: "/"
		});
}]);
app.constant('_', window._);
app.constant("moment", moment);
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
app.controller("ListCtrl", function ($scope, $route, moment, $location, dataFactory, DATAKEY, $localForage, fireFactory) {
	// Vars are set at rootScope, $scope will recursively search up to rootScope
	if ($scope.FBURL === null) {
		$location.path("/settings");
	} else {
		fireFactory.getShopEquipment(function (data) {
			$scope.company = data;

			$scope.changeSelectedEquipmentToEdit = function (equip) {
				$scope.selectedEquipmentToEdit = equip;

				var m = new moment($scope.selectedEquipmentToEdit.purchaseDate)

				$scope.purchaseDate = {
					value: new Date(m.format('YYYY, MM, DD').toString())
				};

				$scope.selectionIdBeforeChange = equip.id;
				console.log('asdf ' + $scope.selectionIdBeforeChange);
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
			$scope.addingEquipment = function () {
				console.log('asdf '  + $scope.selectedEquipmentToEdit.id);
			}
			$scope.cancel = function () {
				console.log('canceling ');
				$route.reload();

			}

			$scope.submit = function () {

				var purchaseDate = new moment($scope.purchaseDate.value);
				$scope.selectedEquipmentToEdit.purchaseDate = purchaseDate.toString()

				if ($scope.selectedEquipmentToEdit.id && $scope.selectedEquipmentToEdit.type && $scope.selectedEquipmentToEdit.model
					&& $scope.selectedEquipmentToEdit.purchaseDate && $scope.selectedEquipmentToEdit.status) {
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
			};
			var tempArray = [];
			var shopFanTotal = 0;
			var shopDehuTotal = 0;
			if (data.shop) {
				for (var i = 0; i < data.shop.length; i++) {
					if (data.shop[i]) {
						if (data.shop[i].type == 'fan' && data.shop[i].status == "Active") {
							shopFanTotal++;
						}
						if (data.shop[i].type == 'dehu' && data.shop[i].status == "Active") {
							shopDehuTotal++;
						}
						tempArray.push(data.shop[i]);
					}
				}
			}
			$scope.shopFans = shopFanTotal;
			$scope.shopDehus = shopDehuTotal;
			$scope.company.shop = tempArray;
		});
		dataFactory.getAll(function (data) {

			var fansTotal = 0;
			var dehusTotal = 0;
			for (var job in data) {
				var dehus = 0;
				var fans = 0;
				var object = data[job];
				var dayList = object.dayList;
				if (dayList) {
					var theseRooms = dayList.slice(-1)[0].rooms;
					for (var y = 0; y < theseRooms.length; y++) {
						var equipmentList = theseRooms[y].equipment;
						if (equipmentList) {
							for (var x = 0; x < equipmentList.length; x++) {
								var equipment = equipmentList[x];
								if (equipment.type == 'dehu') {
									dehus++;
									dehusTotal++;
								}
								if (equipment.type == 'fan') {
									fans++;
									fansTotal++;
								}
							}
						}
					}
				}
				data[job].fans = fans;
				data[job].dehus = dehus;

			}
			$scope.fansTotal = fansTotal;
			$scope.dehusTotal = dehusTotal;
			$scope.contacts = data;

			// Save the retrieved data locally so it's available when we go offline
			//if ($scope.online) {
			//	localforage.setItem(DATAKEY, DATAKEY, function (value) {
			//	});
			//	$localForage.setItem(DATAKEY, data);
			//	//             bind($scope.contacts, data)
			//
			//}
			//else {
			//	// We are offline. localForage operations happen outside of Angular's view, tell Angular data changed
			//	$localForage.getItem(DATAKEY).then(function (d) {
			//		bind($scope.contacts, d);
			//	});
			//	$scope.$apply();
			//}
		});

		// Set our menu tab active and all others inactive
		$("#menu-list").addClass("active");
		$("#menu-new").removeClass("active");
		$("#menu-loaddata").removeClass("active");
		$("#menu-settings").removeClass("active");
	}
	$scope.addNewJob = function (jobID) {
		//TODO this needs to refresh page after job added .. such a fucking hack lol
		console.log('here ' + $scope.contacts)
		dataFactory.addJob(jobID, $scope.contacts);
		var millisecondsToWait = 1500;
		setTimeout(function () {
			$route.reload();

		}, millisecondsToWait);

	}

});

app.controller("ViewJobCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
	dataFactory.getById($routeParams.contactId, function (data) {
		$scope.job = data;
        console.log(data)
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
			dataFactory.delete($scope.job.contactId)
		}
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
                    $scope.form.userForm.zipcode.$modelValue,
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

app.controller("ViewJobBasicsCtrl", function ($modal, $scope, $location, $routeParams, dataFactory, $filter, $http) {
	dataFactory.getById($routeParams.contactId, function (data) {
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
		console.log('osd ' + $scope.job.oldStartDate);
		console.log('sd ' + $scope.job.startDate);
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
				controller:  ModalInstanceCtrl,
				scope:       $scope,
				resolve:     {
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

		$scope.df = dataFactory;

		if (!$scope.online) {
			$scope.$apply();
		}

		$scope.showForm = function (day) {
			$scope.dayNum = day;
			$scope.todaysEquipment = $scope.job.dayList[$scope.dayNum];
			$scope.showFields = false;

			var modalInstance = $modal.open({
				templateUrl: 'views/editequipment-form.html',
				controller:  EquipmentInstanceCtrl,
				scope:       $scope,
				resolve:     {
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
		$scope.addDay = function () {

			var date = new moment($scope.job.dayList.slice(-1)[0].date);//gets last date in array
			//date.setDate(date.getDate() + 1);//adds a day
			date.add('days', 1)
			var newDay = {};
			newDay.rooms = [];
			newDay.date = date.toString();
			for (var y = 0; y < $scope.job.rooms.length; y++) {
				var thisRoom = {}
				thisRoom.name = $scope.job.rooms[y];
				//thisRoom.fans = [];
				//thisRoom.dehus = [];
				thisRoom.equipment = [];
				newDay.rooms.push(thisRoom)
			}
			$scope.job.dayList.push(newDay);
			$scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.job.account.accountName,
				$scope.job.account.address1, $scope.job.account.phone1,
				$scope.job.account.phone2, $scope.job.account.email,
				$scope.job.startDate, $scope.job.rooms, $scope.job.dayList);
		};
	});

	//now load other jobs so when adding equipment
	//we can see if it is already being used
	dataFactory.getAll(function (data) {
		$scope.allJobs = data;
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
		$scope.df = dataFactory;
		//$scope.job.contactId = $routeParams.contactId;
		// We are offline. Localforage operations happen outside of Angular's view, tell Angular data changed
		if (!$scope.online) {
			$scope.$apply();
		}

		$scope.showForm = function () {

			var modalInstance = $modal.open({
				templateUrl: 'views/modal-form.html',
				controller:  ModalInstanceCtrl,
				scope:       $scope,
				resolve:     {
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




