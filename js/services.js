angular.module("angularcrud")

    .factory("fireFactory", function ($rootScope, moment, $http, $location, $firebase) {
        return {
            getAll: function (successCallback) {
                //TODO hacky
                $rootScope.FBURL = "https://andrewscleaning.firebaseio.com/"
                $http.get($rootScope.FBURL + "angularcrud/" + ".json?format=export").success(successCallback);

            },
            getRugJobs: function (successCallback) {
                //TODO hacky
                $rootScope.FBURL = "https://andrewscleaning.firebaseio.com/"
                $http.get($rootScope.FBURL + "rugs/" + ".json?format=export").success(successCallback);

            },
            getRugById: function (id, successCallback) {
                $http.get($rootScope.FBURL + "rugs/" + id + ".json?format=export").success(successCallback);
            },
            getById: function (id, successCallback) {
                $http.get($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(successCallback);
            },
            delete: function (id) {

                $http.delete($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(function () {
                    $location.path("/");
                });
            },
            addRugImage: function (file, id){
                console.log('file' + file)
                var f = file[0];
                var reader = new FileReader();
                var num = Math.floor(Math.random() * (100000000000 - 1)) + 1;
                console.log('num' + num)
                id += '_' + $rootScope.rugId + '_' + num;
                console.log(id)


                reader.onload = (function(theFile) {
                    return function(e) {
                        var filePayload = e.target.result;
                        // Generate a location that can't be guessed using the file's contents and a random number
                        //var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(filePayload));
                        var f = new Firebase($rootScope.FBURL + 'rug_images/' + id + '/filePayload');
                        //spinner.spin(document.getElementById('spin'));
                        // Set the file payload to Firebase and register an onComplete handler to stop the spinner and show the preview
                        f.set(filePayload, function() {
                            //spinner.stop();
                            //document.getElementById("pano").src = e.target.result;
                            //$('#file-upload').hide();
                            // Update the location bar so the URL can be shared with others
                            //window.location.hash = hash;
                        });
                    };
                })(f);
                reader.readAsDataURL(f);
                //$http.post($rootScope.FBURL + "rugs/" + ".json?format=export", file)
                //    .success(function () {
                //        console.log('trying to refresh 2')
                //        $location.path("/rugs");
                //    });
            },
            addRugJob: function (jobID, currentJobs) {

                var thisJob = {};
                $.ajax({
                    type: "GET",
                    url: "https://api.servicemonster.net/v1/orders?q=" + jobID,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (error) {
                        console.log(error)
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv");
                    },
                    complete: function () {
                        console.log('completed')
                    },
                    success: function (json) {

                        thisJob = json.items[0];
                        $.ajax({
                            type: "GET",
                            url: "https://api.servicemonster.net/v1/accounts/" + thisJob.accountID,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            error: function (error) {
                                console.log(error)
                            },
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader("Authorization", "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv");
                            },
                            complete: function (account) {

                                if ($rootScope.online) {

                                    if (!currentJobs || currentJobs == undefined) {
                                        thisJob.active = true;
                                        thisJob.rugStatus = 'Not Started';
                                        $http.post($rootScope.FBURL + "rugs/" + ".json?format=export", thisJob)
                                            .success(function () {
                                                console.log('trying to refresh')
                                                $location.path("/rugs");
                                            });

                                    } else {
                                        var exists = false;

                                        for (var x in currentJobs) {
                                            if (currentJobs[x].accountID == thisJob.accountID) {
                                                exists = true;
                                            }
                                        }
                                        if (!exists) {
                                            thisJob.active = true;
                                            thisJob.rugStatus = 'Not Started';
                                            $http.post($rootScope.FBURL + "rugs/" + ".json?format=export", thisJob)
                                                .success(function () {
                                                    console.log('trying to refresh 2')
                                                    $location.path("/rugs");
                                                });
                                        } else {
                                            console.log('job exists not doing shit')
                                            return "exists";
                                        }
                                        return;
                                    }


                                }
                                else {
                                    account.job = thisJob;
                                    //forageFactory.addJob(job);
                                }
                            },
                            success: function (account) {

                                var companyID = thisJob.companyID;
                                var createdBy = thisJob.createdBy;
                                var accountID = thisJob.accountID;
                                var orderNumber = thisJob.orderNumber;
                                var orderType = thisJob.orderType;
                                var rugStatus = thisJob.rugStatus;
                                console.log('rs' + thisJob.rugStatus)
                                thisJob.rugStatus = 'Not started';
                                thisJob.accountName = account.accountName;
                                thisJob.accountID = accountID;
                                thisJob.reviewed = false;
                                thisJob.workCompleted = false;
                                thisJob.invoiced = false;
                                thisJob.companyID = companyID;
                                thisJob.orderNumber = orderNumber;
                                thisJob.account = account;
                                thisJob.createdBy = createdBy;
                                thisJob.orderType = orderType;

                                $location.path("/");
                            }
                        });
                    }
                });
            },
            addJob: function (jobID, currentJobs) {

                var thisJob = {};
                $.ajax({
                    type: "GET",
                    url: "https://api.servicemonster.net/v1/orders?q=" + jobID,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (error) {
                        console.log(error)
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv");
                    },
                    complete: function () {
                        console.log('completed')
                    },
                    success: function (json) {

                        thisJob = json.items[0];
                        $.ajax({
                            type: "GET",
                            url: "https://api.servicemonster.net/v1/accounts/" + thisJob.accountID,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            error: function (error) {
                                console.log(error)
                            },
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader("Authorization", "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv");
                            },
                            complete: function (account) {

                                if ($rootScope.online) {

                                    if (!currentJobs || currentJobs == undefined) {
                                        thisJob.active = true;
                                        $http.post($rootScope.FBURL + "angularcrud/" + ".json?format=export", thisJob)
                                            .success(function () {
                                                console.log('trying to refresh')
                                                $location.path("/");
                                            });

                                    } else {
                                        var exists = false;

                                        for (var x in currentJobs) {
                                            if (currentJobs[x].accountID == thisJob.accountID) {
                                                exists = true;
                                            }
                                        }
                                        if (!exists) {
                                            thisJob.active = true;
                                            $http.post($rootScope.FBURL + "angularcrud/" + ".json?format=export", thisJob)
                                                .success(function () {
                                                    console.log('trying to refresh')
                                                    $location.path("/");
                                                });
                                        } else {
                                            console.log('job exists not doing shit')
                                            return "exists";
                                        }
                                        return;
                                    }


                                }
                                else {
                                    account.job = thisJob;
                                    //forageFactory.addJob(job);
                                }
                            },
                            success: function (account) {

                                var companyID = thisJob.companyID;
                                var createdBy = thisJob.createdBy;
                                var accountID = thisJob.accountID;
                                var orderNumber = thisJob.orderNumber;
                                var orderType = thisJob.orderType;

                                thisJob = {};
                                thisJob.accountName = account.accountName;
                                thisJob.accountID = accountID;
                                thisJob.reviewed = false;
                                thisJob.workCompleted = false;
                                thisJob.invoiced = false;
                                thisJob.companyID = companyID;
                                thisJob.orderNumber = orderNumber;
                                thisJob.account = account;
                                thisJob.createdBy = createdBy;
                                thisJob.orderType = orderType;
                                $location.path("/");
                            }
                        });
                    }
                });
            },
            updateJob: function (id, smId, name, address, phone1, phone2, email, city, zipcode, startDate, rooms, dayList, roomChanged) {

                //TODO clean out all that bullshit job info
                if (!dayList || dayList.length < 1) {
                    var day1 = {};
                    day1.date = startDate;
                    day1.rooms = [];
                    for (var y = 0; y < rooms.length; y++) {
                        var thisRoom = {}
                        thisRoom.name = rooms[y];
                        thisRoom.equipment = [];
                        day1.rooms.push(thisRoom)
                    }

                    var dayList = [];
                    dayList.push(day1);
                } else {
                    if (roomChanged) {
                        for (var i = 0; i < rooms.length; i++) {
                            for (var x = 0; x < dayList.length; x++) {
                                if (!dayList[x].rooms[i]) {
                                    var thisRoom = {}
                                    thisRoom.name = rooms[i];
                                    thisRoom.equipment = [];
                                    dayList[x].rooms.push(thisRoom);
                                }
                            }

                        }
                    } else {
                        console.log('no room change')
                    }

                }
                $http({
                    url: $rootScope.FBURL + "angularcrud/" + id + ".json?format=export",
                    data: {
                        startDate: startDate,
                        rooms: rooms,
                        dayList: dayList,
                        account: {
                            accountName: name,
                            address1: address,
                            phone1: phone1,
                            phone2: phone2,
                            email: email,
                            city: city,
                            zip: zipcode,
                            ".priority": name.toLowerCase()
                        }
                    },
                    method: "PATCH"
                }).success(function (data, status, headers, config) {
                    console.log('updating sm ')
                    var req = {
                        method: 'PATCH',
                        url: 'https://api.servicemonster.net/v1/accounts/' + smId,
                        headers: {
                            'Authorization': "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv",
                            'Content-Type': "application/json"
                        },
                        data: {
                            accountName: name,
                            address1: address,
                            phone1: phone1,
                            phone2: phone2,
                            email: email,
                            city: city,
                            zip: zipcode
                        }
                    }

                    $http(req).success(function () {
                        $location.path("/view/" + id);
                    }).error(function (error) {
                        console.log(error)
                        $location.path("/view/" + id);
                    });

                }).error(function (error) {
                        console.log(error)
                    })

                    .error(function (error) {
                        console.log(error)
                    });
            },
            getShopEquipment: function (successCallback) {
                $http.get($rootScope.FBURL + "companyinfo" + ".json?format=export").success(successCallback);
            },
            updateShopEquipment: function (equipment) {

                if (!equipment) {
                    equipment = []
                }
                $http({
                    url: $rootScope.FBURL + "companyinfo" + ".json?format=export",
                    data: {
                        shop: equipment
                    },
                    method: "PATCH"
                });
            },
            updateJobEquipment: function (id, room, roomIndex, day, fans, dehus, equipment, labor, time) {

                $http({
                    url: $rootScope.FBURL + "angularcrud/" + id + "/dayList/" + day + ".json?format=export",
                    data: {
                        updatedAt: time
                    },
                    method: "PATCH"
                }).success(function (data, status, headers, config) {

                }).error(function (error) {
                        console.log(error)
                    })

                    .error(function (error) {
                        console.log(error)
                    });

                $http({
                    url: $rootScope.FBURL + "angularcrud/" + id + "/dayList/" + day + "/rooms/" + roomIndex + ".json?format=export",
                    data: {
                        fans: fans,
                        dehus: dehus,
                        equipment: equipment,
                        labor: labor
                    },
                    method: "PATCH"
                }).success(function (data, status, headers, config) {

                    //TODO update SM later on when we figure out our layout
                    //var req = {
                    //    method: 'PATCH',
                    //    url: 'https://api.servicemonster.net/v1/accounts/' + smId,
                    //    headers: {
                    //        'Authorization': "Basic ZTZleGc0Nkw6bUM0RHM5MXFnZXdPUzFv",
                    //        'Content-Type': "application/json"
                    //    },
                    //    data: {
                    //        accountName: name,
                    //        address1: address,
                    //        phone1: phone1,
                    //        phone2: phone2,
                    //        email: email,
                    //    }
                    //}
                    //
                    //$http(req).success(function () {
                    //    $location.path("/view/" + id);
                    //}).error(function (error) {
                    //    console.log(error)
                    //    $location.path("/view/" + id);
                    //});

                }).error(function (error) {
                        console.log(error)
                    })

                    .error(function (error) {
                        console.log(error)
                    });
            },
            updateAllContacts: function (data) {

                //var contactsRef = new Firebase($rootScope.FBURL + "angularcrud/");
                //contactsRef.remove()
                //
                //for (var key in data) {
                //    var obj = data[key];
                //    var newContactRef = contactsRef.push();
                //    var name = obj.name;
                //    var address = obj.address;
                //    var phone1 = obj.phone1;
                //    var phone2 = obj.phone2;
                //    var email = obj.email;
                //
                //    newContactRef.setWithPriority({
                //        name: name,
                //        address: address,
                //        phone1: phone1,
                //        phone2: phone2,
                //        email: email
                //    }, name.toLowerCase());
                //}
                //$location.path("/");
            },
            uploadImage: function (job, image) {

                var fileReader = new FileReader();

                fileReader.onload = function (fileLoadedEvent) {

                    var srcData = fileLoadedEvent.target.result; // <--- data: base64
                    var imageList = job.images;
                    if (!imageList) {
                        imageList = [];
                    }
                    var data = {};
                    data.data = srcData;
                    data.day = 'aDay';
                    data.room = 'aRoom';
                    imageList.push(data);


                    $http({
                        url: $rootScope.FBURL + "angularcrud/" + job.contactId + ".json?format=export",
                        data: {
                            images: imageList
                        },
                        method: "PATCH"
                    }).success(function (data) {

                    });

                };

                fileReader.readAsDataURL(image);

            },
            getImage: function (i, successCallback) {
                console.log('b')
                $http({
                    url: $rootScope.FBURL + "pictures/pic/" + ".json?format=export",

                    method: "GET"
                }).success(successCallback);
            }
        }
    })