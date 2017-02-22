angular.module('casinocoin.controllers')

.controller('AddressbookCtrl', function ($scope, $log, $ionicPopup) {
    $log.debug("### AddressbookCtrl ###");
    $scope.moreDataCanBeLoaded = true;
    $scope.addressOffset = 0;
    $scope.addressLimit = 10;
    $scope.addressbookArray = [];
    $scope.newAddress = {};

    $scope.closeAddressbookModal = function () {
        $scope.addressbookModal.hide();
    }

    $scope.addNewAddress = function () {
        $log.debug("### addNewAddress ###");
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="newAddress.label" placeholder="Label"><br> <input type="text" ng-model="newAddress.address" placeholder="Address">',
            title: 'New Address',
            subTitle: 'Enter a label and the adress',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                  text: '<b>Save</b>',
                  type: 'button-assertive',
                  onTap: function (e) {
                      if (!$scope.newAddress.address) {
                          //don't allow the user to close unless he enters an address
                          e.preventDefault();
                      } else {
                          return $scope.newAddress.address;
                      }
                  }
              }
            ]
        });
    }
})