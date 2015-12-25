'use strict';


angular.module('angularcrud')

    .controller('RugsCtrl', function ($scope, usSpinnerService, $route, moment, GMaps, $location, DATAKEY, $localForage, fireFactory) {

        $scope.loading = true;
        usSpinnerService.spin('spinner-1');
        $scope.alert = "alert-success";

        fireFactory.getRugJobs(function (data) {
            $scope.jobs = data;
            $scope.loading = false;
        });

        // Set our menu tab active and all others inactive
        $('#menu-list').addClass('active');
        $('#menu-new').removeClass('active');
        $('#menu-loaddata').removeClass('active');
        $('#menu-settings').removeClass('active');

        $scope.addNewRugJob = function (jobID) {
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
            try {
                var rugs = $scope.job.rugs;
                if (!rugs) {
                    console.log('no rugs assigned to job, creating new array')
                    $scope.job.rugs = [];
                }

            } catch (e) {
                $scope.job.rugs = rugs;
                console.log('no rugs assigned to job, creating new array')
            }
            console.log('asdf')
        });

        $scope.deleteJob = function () {
            fireFactory.delete($scope.job.contactId);
        };

        $scope.addRug = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/rugs/addrug-form.html',
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

var AddRugInstanceCtrl = function ($rootScope, $scope, $modalInstance, userForm, $route, fireFactory, $location) {
    $scope.form = {};
    var rugId = Math.floor(Math.random() * (100000000000 - 1)) + 1;

    $scope.getData = function () {
        var data = {};
        data.jobId = $scope.job.contactId;
        data.rugId = rugId;
        data.rugCount = $scope.job.rugs.length;
        return data;
    }


    $scope.removeRoom = function (room) {
        $scope.job.rooms.splice($scope.job.rooms.indexOf(room), 1);
        $scope.roomChanged = true;
    };
    $scope.submitForm = function () {
        if ($scope.form.userForm.$valid) {
            var rug = {};
            rug.rugId = rugId;
            rug.size = $scope.rug.size;
            $scope.job.rugs.push(rug)
            fireFactory.getRugImages($scope.job.contactId, rug.rugId, function (data) {

            console.log('images length ' +data)
                fireFactory.addRug($scope.job.contactId, $scope.job.rugs);
                $location.path("/rugs");
                $route.reload();
            });
        } else {
            $route.reload();
        }
    };
    $scope.cancel = function () {
        console.log('just canceled');
        $modalInstance.dismiss('cancel');
    };
};

