/*
 * Services to interact with our data storage - Server using Firebase and local via localForage
 */
angular.module("angularcrud")
    /*
     * Our controllers interact with dataFactory which is a facade for remote server data or local storage. If we have
     * a network connection, we use our REST service, otherwise we use our local storage (browser storage) service.
     */
    .factory("dataFactory", function ($rootScope, fireFactory, forageFactory, $location, DATAKEY, $localForage) {
        return {
            getAll: function (successCallback) {
                if ($rootScope.online) {

                    fireFactory.getAll(successCallback);
                }
                else {
                    forageFactory.getAll(successCallback);
                }
            },
            getById: function (id, successCallback) {
                if ($rootScope.online) {
                    fireFactory.getById(id, successCallback);
                }
                else {
                    forageFactory.getById(id, successCallback);
                }
            },
            delete: function (id) {
                if ($rootScope.online) {
                    fireFactory.delete(id);
                }
                else {
                    forageFactory.delete(id);
                }
            },
            //update: function (id, smId, name, address, phone1, phone2, email) {
            //    if ($rootScope.online) {
            //        fireFactory.update(id, smId, name, address, phone1, phone2, email);
            //    }
            //    else {
            //        forageFactory.update(id, smId, name, address, phone1, phone2, email);
            //    }
            //},
            updateJob: function (id, smId, name, address, phone1, phone2, email, city, zipcode, startDate, rooms, dayList, roomChanged) {
                if ($rootScope.online) {
                    fireFactory.updateJob(id, smId, name, address, phone1, phone2, email, city, zipcode, startDate, rooms, dayList, roomChanged);
                }
                else {
                    //forageFactory.updateJob(id, smId, name, address, phone1, phone2, email);
                }
            },
            updateJobEquipment: function (id, room, roomIndex, day, fans, dehus, equipment, time) {
                if ($rootScope.online) {
                    fireFactory.updateJobEquipment(id, room, roomIndex, day, fans, dehus, equipment, time);
                }
                else {
                    //forageFactory.updateJob(id, smId, name, address, phone1, phone2, email);
                }
            },
            add: function (first, last) {
                if ($rootScope.online) {
                    fireFactory.add(first, last);
                }
                else {
                    forageFactory.add(first, last);
                }
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
                                console.log('completed #2 ')
                                if ($rootScope.online) {
                                    console.log('we are online ')
                                    //account.job = thisJob;
                                    //thisJob.account = account;
                                    //TODO need to see if the job is already here and not add

                                    var found = false;
                                    if (!currentJobs || currentJobs == undefined) {
                                        console.log('no jobs sending first to fire factory ')
                                        fireFactory.addJob(thisJob, currentJobs);
                                        return;
                                    }
                                    console.log(thisJob)

                                    fireFactory.addJob(thisJob, currentJobs);

                                }
                                else {
                                    account.job = thisJob;
                                    //forageFactory.addJob(job);
                                }
                            },
                            success: function (account) {
                                thisJob.account = account;
                                $location.path("/");
                            }
                        });
                    }
                });

                // if ($rootScope.online) {
                //     fireFactory.add(jobID);
                // }
                // else {
                //     forageFactory.add(jobID);
                // }
            },
            updateAllContacts: function () {
                $localForage.getItem(DATAKEY).then(function (contacts) {
                    fireFactory.updateAllContacts(contacts);
                });
                //localforage.getItem(DATAKEY, function (contacts) {
                //   alert('pushing in '+ contacts)
                //   fireFactory.updateAllContacts(contacts);
                //});
            }
        }
    })
// Data interface, called by dataFactory for server storage. This is used when we have a network connection. For
// firebase adding .json to the URL returns JSON format, ?format=export adds the .priority attribute to the output
    .factory("fireFactory", function ($rootScope, moment, $http, $location, $firebase) {
        return {
            getAll: function (successCallback) {
                //TODO hacky
                $rootScope.FBURL = "https://andrewscleaning.firebaseio.com/"
                $http.get($rootScope.FBURL + "angularcrud/" + ".json?format=export").success(successCallback);

            },
            getById: function (id, successCallback) {
                $http.get($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(successCallback);
            },
            delete: function (id) {

                $http.delete($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(function () {
                    $location.path("/");
                });
            },
            // Note use of HTTP method PATCH.
            //    Updating Data with PATCH (https://firebase.com/docs/rest/guide/saving-data.html)
            //       Using a PATCH request, you can update specific children at a location without overwriting existing
            // data.
            updateJob: function (id, smId, name, address, phone1, phone2, email, city, zipcode, startDate, rooms, dayList, roomChanged) {

                //TODO clean out all that bullshit job info?
                console.log('city '+city );
                console.log('zipcodee '+zipcode);
                console.log('rs '+rooms);
                if (!dayList || dayList.length < 1) {
                    console.log('has day ');
                    var day1 = {};
                    day1.date = startDate;
                    day1.rooms = [];
                    console.log('here '+rooms[0].name);
                    for (var y = 0; y < rooms.length; y++) {
                        var thisRoom = {}
                        thisRoom.name = rooms[y];
                        thisRoom.equipment = [];
                        day1.rooms.push(thisRoom)
                    }

                    var dayList = [];
                    dayList.push(day1);
                } else {
                    console.log('adding rooms to days')
                    if (roomChanged) {
                        //console.log('rooms.length ' + rooms.length)
                        for (var i = 0; i < rooms.length; i++) {
                            for (var x = 0; x < dayList.length; x++) {
                                if (!dayList[x].rooms[i]) {
                                    console.log('adding new room to all days')
                                    console.log(' room name to add = ' + rooms[i])
                                    var thisRoom = {}
                                    thisRoom.name = rooms[i];
                                    //thisRoom.fans = [];
                                    //thisRoom.dehus = [];
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
            //addRoomToJob: function (id, smId, name, address, phone1, phone2, email, startDate, rooms, dayList,
            // roomChanged) {  console.table(rooms) if (!dayList || dayList.length < 1) { var day1 = {}; day1.date =
            // startDate; day1.rooms = [];  for(var y = 0 ; y < rooms.length; y++){ var thisRoom = {} thisRoom.name =
            // rooms[y]; thisRoom.fans = []; thisRoom.dehus = []; day1.rooms.push(thisRoom) }   var dayList = [];
            // dayList.push(day1); } else { console.log('adding rooms to days') for(var y = 0 ; y < rooms.length; y++){
            // var thisRoom = {} thisRoom.name = rooms[y]; thisRoom.fans = []; thisRoom.dehus = [];
            // day1.rooms.push(thisRoom) } } $http({ url: $rootScope.FBURL + "angularcrud/" + id +
            // ".json?format=export", data: { startDate: startDate, rooms: rooms, dayList: dayList }, method: "PATCH"
            // }).success(function (data, status, headers, config) {   }).error(function (error) { console.log(error)
            // })  .error(function (error) { console.log(error) }); },
            getShopEquipment: function (successCallback) {
                $http.get($rootScope.FBURL + "companyinfo" + ".json?format=export").success(successCallback);
            },
            updateShopEquipment: function (equipment) {
                console.log('updating shop eq ');
                console.log(equipment)
                if (!equipment) {
                    equipment = []
                    //var dummyEq = {};
                    //dummyEq.id = "system";
                    //dummyEq.status = "Broken"
                    //    equipment.push(dummyEq)
                }
                $http({
                    url: $rootScope.FBURL + "companyinfo" + ".json?format=export",
                    data: {
                        shop: equipment
                    },
                    method: "PATCH"
                });

                //	.success(function (data, status, headers, config) {
                //    console.log('success')
                //
                //
                //}).error(function (error) {
                //    console.log(error)
                //})
                //
                //    .error(function (error) {
                //        console.log(error)
                //    });
            },


            updateJobEquipment: function (id, room, roomIndex, day, fans, dehus, equipment, time) {
                console.log('time in system ' + time)
                $http({
                    url: $rootScope.FBURL + "angularcrud/" + id + "/dayList/" + day + ".json?format=export",
                    data: {
                        updatedAt: time
                    },
                    method: "PATCH"
                }).success(function (data, status, headers, config) {
                    console.log('s	')
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
                        equipment: equipment

                        //    dayList: {
                        //        "/day": {room1 :
                        //        {fans: fans, dehus: dehus}
                        //    }
                        //}
                    },
                    method: "PATCH"
                }).success(function (data, status, headers, config) {
                    console.log('success')
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

            //update: function (id, name, address, phone1, phone2, email) {
            //$http({
            //    url: $rootScope.FBURL + "angularcrud/" + id + ".json?format=export",
            //    data: {
            //        name: name,
            //        address: address,
            //        phone1: phone1,
            //        phone2: phone2,
            //        email: email,
            //        ".priority": name.toLowerCase()
            //    },
            //    method: "PATCH"
            //}).success(function (data, status, headers, config) {
            //    $location.path("/view/" + id);
            //});
            //},
            add: function (first, last) {
                $http.post($rootScope.FBURL + "angularcrud/" + ".json?format=export", {
                    firstname: first,
                    lastname: last,
                    ".priority": last.toLowerCase() + " " + first.toLowerCase()
                })
                    .success(function () {
                        $location.path("/");
                    });
            },
            addJob: function (job, currentJobs) {
                console.log('adding job ')
                var exists = false;

                for (var x in currentJobs) {
                    if (currentJobs[x].accountID == job.accountID) {
                        console.log('qas i even here ')
                        exists = true;
                    }
                }
                if (!exists) {
                    console.log('posting to fb ')
                    job.active = true;
                    $http.post($rootScope.FBURL + "angularcrud/" + ".json?format=export", job)
                        .success(function () {
                            console.log('trying to refresh')
                            $location.path("/");
                        });
                } else {
                    console.log('job exists not doing shit')
                    return "exists";
                }

            },
            updateAllContacts: function (data) {
                var contactsRef = new Firebase($rootScope.FBURL + "angularcrud/");   // Use AngularFire to connect to
                                                                                     // Firebase
                contactsRef.remove();                                                // Remove all data from Firebase

                // Note we let Firebase reassign the id for all objects. Preexisting items will
                // get new ids and new items (that we gave a temp id) get reassigned.
                for (var key in data) {                            // Iterate through local data saving to Firebase
                    var obj = data[key];
                    var newContactRef = contactsRef.push();
                    var name = obj.name;
                    var address = obj.address;
                    var phone1 = obj.phone1;
                    var phone2 = obj.phone2;
                    var email = obj.email;

                    newContactRef.setWithPriority({
                        name: name,
                        address: address,
                        phone1: phone1,
                        phone2: phone2,
                        email: email
                    }, name.toLowerCase());
                }
                $location.path("/");
            }
        }
    })

// Data interface called by dataFactory for local storage. This is used when we don't have a network connection.
    .factory("forageFactory", function ($rootScope, $location, DATAKEY, $localForage) {
        return {
            getAll: function (successCallback) {

                $localForage.getItem(DATAKEY).then(successCallback);

                //         localforage.getItem(DATAKEY, successCallback);

            },
            getById: function (id, successCallback) {
                localforage.getItem(DATAKEY, function (contact) {
                    successCallback(contact[id]);
                });
            },
            delete: function (id) {
                localforage.getItem(DATAKEY, function (contact) {
                    delete contact[id];
                    localforage.setItem(DATAKEY, contact, function (data) {
                        // $rootScope.$apply(function () {
                        // $location.path("/");
                        // });
                    });
                });
            },
            update: function (id, name, address, phone1, phone2, email) {

                localforage.getItem(DATAKEY, function (contact) {
                    contact[id].name = name;
                    contact[id].address = address;
                    contact[id].phone1 = phone1;
                    contact[id].phone2 = phone2;
                    contact[id].email = email;

                    // Note syntax for attribute that starts with a period
                    contact[id][".priority"] = name.toLowerCase();
                    localforage.setItem(DATAKEY, contact, function (data) {
                        $rootScope.$apply(function () {
                            $location.path("/view/" + id);
                        });
                    });
                });
            },
            add: function (first, last) {
                // Create a dummy key.
                var id = "-";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                // Build up a key by iterating through the possible chars grabbing 20 random characters
                for (var i = 0; i < 19; ++i) {
                    id += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                $localForage.getItem(DATAKEY).then(function (contacts) {
                    contacts[id] = {};
                    contacts.firstname = first;
                    contacts.lastname = last;

                    $localForage.setItem(DATAKEY, contacts).then(function () {
                        $rootScope.$apply(function () {
                            $location.path("/");
                        });
                    });
                });

                //localforage.getItem(DATAKEY, function (contact) {  // Get all localStorage data
                //   contact[id] = {};                                        // Create a new child element
                //   contact[id].firstname = first;                           // Set values for new child element
                //   contact[id].lastname = last;
                //
                //   // Replace localStorage date with updated version
                //   localforage.setItem(DATAKEY, contact, function (data) {
                //      $rootScope.$apply(function () {
                //         $location.path("/");
                //      });
                //   });
                //});

            }
        }
    });
