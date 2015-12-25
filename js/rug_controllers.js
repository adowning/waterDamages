'use strict';


angular.module('angularcrud')

.controller('RugsCtrl', function ($scope, usSpinnerService, $route, moment, GMaps, $location, DATAKEY, $localForage, fireFactory) {
    // Vars are set at rootScope, $scope will recursively search up to rootScope
    $scope.loading = true;
    usSpinnerService.spin('spinner-1');

    if ($scope.FBURL === null) {
        $location.path('/settings');
    } else {
        var map = {};


        fireFactory.getShopEquipment(function (data) {
            $scope.company = data;

            $scope.changeSelectedEquipmentToEdit = function (equip) {
                $scope.selectedEquipmentToEdit = equip;

                var m = new moment($scope.selectedEquipmentToEdit.purchaseDate.value);

                $scope.purchaseDate = {
                    value: new Date(m.format('YYYY, MM, DD').toString())
                };

                $scope.selectionIdBeforeChange = equip.id;
            };

            $scope.equipTypes = [{
                type: 'fan'
            }, {
                type: 'dehu'
            }, {
                type: 'other'
            }];
            $scope.equipStatus = [{
                status: 'Active'
            }, {
                status: 'Broken'
            }, {
                status: 'Lost'
            }];

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
                );
                var millisecondsToWait = 1500;
                setTimeout(function () {
                    $route.reload();

                }, millisecondsToWait);

            };
            $scope.add = function () {
                $scope.selectedEquipmentToEdit = {};
                $scope.adding = true;
            };
            $scope.addingEquipment = function (asdf) {
                //console.log('adding ' + $scope.selectedEquipmentToEdit.id);
                $scope.equipmentBeingAdded = asdf;
                var m = new moment($scope.equipmentBeingAdded.purchaseDate.value);

                $scope.purchaseDate = {
                    value: new Date(m.format('YYYY, MM, DD').toString())
                };
                console.log('asdf' + asdf);
            };
            $scope.cancel = function () {
                console.log('canceling ');
                $route.reload();

            };

            $scope.submit = function () {
                if ($scope.equipmentBeingAdded) {
                    var newEquipment = {};
                    newEquipment.id = $scope.equipmentBeingAdded.id.$viewValue;
                    newEquipment.purchaseDate = {};
                    newEquipment.purchaseDate.value = $scope.equipmentBeingAdded.purchaseDate.$viewValue;
                    newEquipment.type = $scope.equipmentBeingAdded.type.$viewValue;
                    newEquipment.model = $scope.equipmentBeingAdded.model.$viewValue;
                    newEquipment.status = $scope.equipmentBeingAdded.status.$viewValue;

                    var tempDate = new moment($scope.equipmentBeingAdded.purchaseDate.$viewValue);
                    newEquipment.prettyPurchaseDate = tempDate.format('MM/DD/YYYY');
                    $scope.company.shop.push(newEquipment);

                    if ($scope.equipmentBeingAdded.id.$viewValue && $scope.equipmentBeingAdded.type.$viewValue &&
                        $scope.equipmentBeingAdded.model.$viewValue && $scope.equipmentBeingAdded.purchaseDate.$viewValue && $scope.equipmentBeingAdded.status.$viewValue) {
                        fireFactory.updateShopEquipment(
                            $scope.company.shop
                        );
                        var millisecondsToWait = 1500;
                        setTimeout(function () {
                            $route.reload();

                        }, millisecondsToWait);

                    } else {
                        alert('Error: Not all equipment information was filled out, please redo form.');
                        return;
                    }
                    return;
                }
                if ($scope.selectedEquipmentToEdit) {
                    $scope.selectedEquipmentToEdit.purchaseDate.value = $scope.purchaseDate.value;

                    var tempDate = new moment($scope.purchaseDate.value);
                    $scope.selectedEquipmentToEdit.prettyPurchaseDate = tempDate.format('MM/DD/YYYY');

                    if ($scope.selectedEquipmentToEdit.purchaseDate.value && $scope.selectedEquipmentToEdit.id &&
                        $scope.selectedEquipmentToEdit.type && $scope.selectedEquipmentToEdit.model && $scope.selectedEquipmentToEdit.status) {
                        fireFactory.updateShopEquipment(
                            $scope.company.shop
                        );
                        var millisecondsToWait = 1500;
                        setTimeout(function () {
                            $route.reload();

                        }, millisecondsToWait);

                    } else {
                        alert('Error: Not all equipment information was filled out, please redo form.');
                    }
                }
            };
            var tempArray = [];
            var shopFans = [];
            var shopDehus = [];
            if (data.shop) {
                for (var i = 0; i < data.shop.length; i++) {
                    if (data.shop[i]) {
                        if (data.shop[i].type == 'fan' && data.shop[i].status == 'Active') {
                            shopFans.push(data.shop[i].id);
                        }
                        if (data.shop[i].type == 'dehu' && data.shop[i].status == 'Active') {
                            shopDehus.push(data.shop[i].id);

                        }
                        var tempDate = new moment(data.shop[i].purchaseDate);
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
        fireFactory.getRugJobs(function (data) {

            for (var job in data) {
                console.table(job);

                var fansTotal = 0;
                var dehusTotal = 0;
                var addresses = [];
                var dehuList = [];
                var fanList = [];
                var object = data[job];
                var dayList = object.dayList;
                var today = new Date();

                if (dayList) {
                    for (var i = 0; i < dayList.length; i++) {
                        var dayOnSite = new Date(dayList[i].date);

                        var theseRooms = dayList[i].rooms;
                        if (today.setHours(0, 0, 0, 0) == dayOnSite.setHours(0, 0, 0, 0)) {

                            for (var y = 0; y < theseRooms.length; y++) {
                                var equipmentList = theseRooms[y].equipment;
                                if (equipmentList) {
                                    for (var x = 0; x < equipmentList.length; x++) {
                                        var equipment = equipmentList[x];
                                        if (equipment.type == 'dehu') {
                                            dehuList.push(equipment.id);
                                            dehusTotal++;
                                        }
                                        if (equipment.type == 'fan') {
                                            fansTotal++;
                                            fanList.push(equipment.id);
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
                data[job].fanList = fanList;
                data[job].dehuList = dehuList;

                var d = new Date(data[job].startDate);
                if (tempDate) {
                    var tempDate = new moment(d.toISOString());
                    data[job].prettyStartDate = tempDate.format('MM/DD/YYYY');
                }

            }

            $scope.contacts = data;

        });

        //$scope.fansTotal = fansTotal;
        //$scope.dehusTotal = dehusTotal;
        $scope.alertMe = function () {
            setTimeout(function () {
                map.refresh();

            });
        };
        // Set our menu tab active and all others inactive
        $('#menu-list').addClass('active');
        $('#menu-new').removeClass('active');
        $('#menu-loaddata').removeClass('active');
        $('#menu-settings').removeClass('active');
    }
    $scope.addNewRugJob = function (jobID) {
        //TODO this needs to refresh page after job added .. such a fucking hack lol
        console.log('adding new job ' + $scope.contacts);

        fireFactory.addRugJob(jobID, $scope.contacts);
        var millisecondsToWait = 1500;
        setTimeout(function () {
            $route.reload();

        }, millisecondsToWait);

    };

})
.controller('ViewRugJobCtrl', function ($modal, $scope, $location, $routeParams, fireFactory, $filter, $http) {
    fireFactory.getRugById($routeParams.contactId, function (data) {
        $scope.job = data;
        $scope.job.contactId = $routeParams.contactId;
    });

    $(document).ready(function () {
        $(function () {

            var idx = window.location.href.indexOf('#');

            // A hash was passed in, so let's retrieve and render it.
            var f = new Firebase('https://andrewscleaning.firebaseio.com/' + 'pano/' + 'asdf' + '/filePayload');
            f.once('value', function (snap) {
                var payload = snap.val();
                if (payload != null) {
                    console.log('not null' + payload)
                    document.getElementById('pano').src = payload;

                } else {
                    $('#body').append('Not found');
                    console.log('null')
                }
                //spinner.stop();
            });

        });
    });

    $scope.deleteJob = function () {
        console.log('deleting ' + $scope.job);
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
            alert('you cannot delete a job that still has equipment on it');
        } else {
            fireFactory.delete($scope.job.contactId);
        }
    };

    $scope.addRug = function () {
        var modalInstance = $modal.open({
            templateUrl: 'views/addrug-form.html',
            controller: AddRugInstanceCtrl,
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
            $location.path('/');
        }, function () {
            console.info('Modal dismissed at: ' + new Date());
        });
    };
    $('#menu-list').removeClass('active');
    $('#menu-new').removeClass('active');
    $('#menu-loaddata').removeClass('active');
    $('#menu-settings').removeClass('active');
});

var AddRugInstanceCtrl = function ($rootScope, $scope, $modalInstance, userForm, $route) {
    $scope.form = {};
    $scope.cancel = function () {
    };

    $scope.getData = function(){
        return 'asdf';
    }
    var rugId = Math.floor(Math.random() * (100000000000 - 1)) + 1;
    $rootScope.rugId = rugId;
    console.log('id' + $scope.job.contactId)
    $rootScope.contactId = $scope.job.contactId;
    //    console.table("xxxx");
    //    var f = evt.target.files[0];
    //    var reader = new FileReader();
    //    reader.onload = (function () {
    //        return function (e) {
    //            var filePayload = e.target.result;
    //            // Generate a location that can't be guessed using the file's contents and a random number
    //            //var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(filePayload));
    //            var f = new Firebase(firebaseRef + 'pano/' + hash + '/filePayload');
    //            //spinner.spin(document.getElementById('spin'));
    //            // Set the file payload to Firebase and register an onComplete handler to stop the spinner and show the preview
    //            f.set(filePayload, function () {
    //                spinner.stop();
    //                document.getElementById('pano').src = e.target.result;
    //                //$('#file-upload').hide();
    //                // Update the location bar so the URL can be shared with others
    //                //window.location.hash = hash;
    //            });
    //        };
    //    })(f);
    //    reader.readAsDataURL(f);
    //};
    //$(document).ready(function() {
    //    $(function() {
    //        $('#spin').append(spinner);
    //
    //        var idx = window.location.href.indexOf('#');
    //        var hash = (idx > 0) ? window.location.href.slice(idx + 1) : '';
    //        if (hash === '') {
    //            // No hash found, so render the file upload button.
    //            $('#file-upload').show();
    //            document.getElementById('file-upload').addEventListener('change', handleFileSelect, false);
    //        } else {
    //            // A hash was passed in, so let's retrieve and render it.
    //            spinner.spin(document.getElementById('spin'));
    //            var f = new Firebase(firebaseRef + '/pano/' + hash + '/filePayload');
    //            f.once('value', function(snap) {
    //                var payload = snap.val();
    //                if (payload != null) {
    //                    document.getElementById('pano').src = payload;
    //                } else {
    //                    $('#body').append('Not found');
    //                }
    //                spinner.stop();
    //            });
    //        }
    //    });
    //    $scope.progress = function(percentDone) {
    //        console.log("progress: " + percentDone + "%");
    //    };
    //    $scope.done = function(files, data) {
    //        console.log("upload complete");
    //        console.log("data: " + JSON.stringify(data));
    //        writeFiles(files);
    //    };
    //    $scope.getData = function(files) {
    //        return {msg: "from the client", date: new Date()};
    //    };
    //    $scope.error = function(files, type, msg) {
    //        console.log("Upload error: " + msg);
    //        console.log("Error type:" + type);
    //        writeFiles(files);
    //    }
    //
    //    $scope.fileAdded = function(file){
    //        console.log('file: '+file.name+' selected');
    //    }
    //
    //    function writeFiles(files)
    //    {
    //        var msg = "Files<ul>";
    //        for (var i = 0; i < files.length; i++) {
    //            msg += "<li>" + files[i].name + "</li>";
    //        }
    //        msg += "</ul>";
    //        console.log(msg);
    //    }
    //var elem = document.getElementById("console");
    //var console = angular.element(elem);
    //function log(msg) {
    //    console.log('asdf')
    //    console.log(msg)
    //    var html = console.html();
    //    if (html.length) {
    //        html += "<br />";
    //    }
    //    html += msg;
    //    console.html(html);
    //    elem.scrollTop = elem.scrollHeight;
    //}
    //});

    //$(function() {
    //    $('#spin').append(spinner);
    //
    //    var idx = window.location.href.indexOf('#');
    //    var hash = (idx > 0) ? window.location.href.slice(idx + 1) : '';
    //    if (hash === '') {
    //        // No hash found, so render the file upload button.
    //        $('#file-upload').show();
    //        document.getElementById("file-upload").addEventListener('change', handleFileSelect, false);
    //    } else {
    //        // A hash was passed in, so let's retrieve and render it.
    //        spinner.spin(document.getElementById('spin'));
    //        var f = new Firebase(firebaseRef + '/pano/' + hash + '/filePayload');
    //        f.once('value', function(snap) {
    //            var payload = snap.val();
    //            if (payload != null) {
    //                document.getElementById("pano").src = payload;
    //            } else {
    //                $('#body').append("Not found");
    //            }
    //            spinner.stop();
    //        });
    //    }
    $scope.removeRoom = function (room) {
        $scope.job.rooms.splice($scope.job.rooms.indexOf(room), 1);
        $scope.roomChanged = true;
    };
    $scope.submitForm = function () {
        if ($scope.form.userForm.$valid) {
            var rug = {};
            rug.size = $scope.rug.size;
            console.log('size' + $scope.rug.size)
            rug.iD = $rootScope.rugId;
            console.log('size' + rug.iD)

            //if ($scope.job.dayList) {
            //        for (var i = 0; i < $scope.job.dayList.length; i++) {
            //            //console.log('daylist = ' + new moment($scope.job.dayList[i].date).toString())
            //            var sd = new moment($scope.form.userForm.startDate.$modelValue);
            //
            //            var dateToCheck = new moment(sd.add('day', i).toString());
            //            //console.log('dtc = ' + dateToCheck.toString())
            //            $scope.job.dayList[i].date = dateToCheck.toString();
            //        }
            //    } else {
            //        var sd = new moment($scope.form.userForm.startDate.$modelValue);
            //
            //    }
            //    var sd = new moment($scope.form.userForm.startDate.$modelValue);
            //    $scope.df.updateJob($scope.job.contactId, $scope.job.accountID, $scope.form.userForm.name.$modelValue,
            //        $scope.form.userForm.address.$modelValue, $scope.form.userForm.phone1.$modelValue,
            //        $scope.form.userForm.phone2.$modelValue, $scope.form.userForm.email.$modelValue, $scope.form.userForm.city.$modelValue,
            //        $scope.form.userForm.zip.$modelValue,
            //        sd.toString(), $scope.job.rooms, $scope.job.dayList, $scope.roomChanged);
            //    $modalInstance.close('closed');
            //    return;
            //if (!$scope.form.userForm.startDate.$modelValue && !$scope.job.oldStartDate) {
            //    $modalInstance.close('closed');
            //    alert('This job needs a start Date');
            //    return;
            //}
            //if (!$scope.job.rooms || $scope.job.rooms.length < 1) {
            //    $modalInstance.close('closed');
            //    alert('This job needs at least one room');
            //    return;
            //}

        } else {
            $route.reload();

        }
    };

    $scope.cancel = function () {
        console.log('just canceled');
        $modalInstance.dismiss('cancel');
    };
};

