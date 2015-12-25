'use strict';


angular.module('angularcrud')

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


