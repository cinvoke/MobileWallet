angular.module('casinocoin.controllers')

.controller('AddressbookCtrl', function ($scope, $log, $ionicPopup, $ionicModal,
                                         WalletService, $filter, $cordovaBarcodeScanner,
                                         $ionicListDelegate, $cordovaSocialSharing
                                         ) {
    $log.debug("### AddressbookCtrl ###");
    $scope.noMoreScroll = true;
    $scope.addressOffset = 0;
    $scope.addressLimit = 10;
    $scope.addressbookArray = [];
    $scope.newAddress = { label:"", address:"" };
    $scope.qrcodeData = {};

    // Create the QRCode modal that we will use later
    $ionicModal.fromTemplateUrl('templates/modals/show-qrcode.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### show qrcode modal created");
        $scope.qrcodeModal = modal;
    });

    function processAddressResult(addressResultSet){
        if (addressResultSet.length > 0) {
            angular.forEach(addressResultSet, function(newAddress){
                $scope.addressbookArray.push(newAddress);
            });
            if (addressResultSet.length >= $scope.addressLimit) {
                $scope.noMoreScroll = false;
            }
        } else {
            $scope.noMoreScroll = true;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
    }

    $scope.getAllAddresses = function () {
        $log.debug("### getAllAddresses - offset: " + $scope.addressOffset + " limit: " + $scope.addressLimit);
        WalletService.getBookAddresses($scope.addressOffset, $scope.addressLimit).then(function (addressResultSet) {
            $log.debug("### addressResultSet count: " + addressResultSet.length);
            processAddressResult(addressResultSet);
        });
    }

    $scope.$on('modal.shown', function (event, modal) {
        if (modal.id == 'addressbookModal') {
            $log.debug('### Modal ' + modal.id + ' is shown!');
            $scope.getAllAddresses();
        }
    });

    $scope.loadMoreAddresses = function () {
        $scope.addressOffset += $scope.addressLimit;
        $log.debug("### Load more Address - offset: " + $scope.addressOffset + " limit: " + $scope.addressLimit);
        WalletService.getBookAddresses($scope.addressOffset, $scope.addressLimit).then(function (addressResultSet) {
            $log.debug("### addressResultSet count: " + addressResultSet.length);
            processAddressResult(addressResultSet);
        });
    }

    $scope.closeAddressbookModal = function () {
        $scope.addressbookModal.hide();
    }

    $scope.scanCscQrCode = function () {
        $cordovaBarcodeScanner
          .scan()
          .then(function (barcodeData) {
              // Success! Barcode data is here
              $log.debug("### barcode: " + JSON.stringify(barcodeData));
              if (!barcodeData.cancelled) {
                  // get send to address
                  var addressStart = barcodeData.text.indexOf(":") + 1;
                  var addressEnd = barcodeData.text.indexOf("?");
                  if (addressEnd < 0) {
                      addressEnd = barcodeData.text.length;
                  }
                  var sendAddress = barcodeData.text.substring(addressStart, addressEnd);
                  $log.debug("### Address: " + sendAddress);
                  if(WalletService.validateAddress(sendAddress)){
                      $scope.newAddress.address = sendAddress;
                  }
              }
          }, function (error) {
              // An error occurred
              $log.error("### barcode error: " + JSON.stringify(error));
          });
    }

    $scope.addNewAddress = function () {
        $log.debug("### addNewAddress ###");
        var popupTemplate = "<input type='text' ng-model='newAddress.label' placeholder={{'l_label'|translate}}><br>" +
                            "<textarea rows=3 ng-model='newAddress.address' placeholder={{'l_csc_address'|translate}}>";
        var newAddressPopup = $ionicPopup.show({
            template: popupTemplate,
            title: $filter('translate')('l_add_address'),
            subTitle: $filter('translate')('l_add_address_desc'),
            scope: $scope,
            buttons: [
              { type: 'button icon fa fa-ban' },
              { type: 'button button-assertive icon fa fa-qrcode',
                onTap: function (e){
                    $scope.scanCscQrCode();
                }
              },
              {
                  type: 'button button-assertive icon fa fa-floppy-o',
                  onTap: function (e) {
                      $log.debug("### Add Address: " + angular.toJson($scope.newAddress));
                      if (!$scope.newAddress.address || !$scope.newAddress.label) {
                          //don't allow the user to close unless he enters an address
                          e.preventDefault();
                      } else {
                          return $scope.newAddress;
                      }
                  }
              }
            ]
        });
        newAddressPopup.then(function(result){
            $log.debug("### Add Address Result: " + angular.toJson(result));
            if(WalletService.validateAddress(result.address)){
                WalletService.addBookAddress(result);
                $scope.newAddress = { label:"", address:"" };
                $scope.refreshAddressbook();
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: $filter('translate')('l_error'),
                    template: $filter('translate')('l_invalid_csc_address')
                });

                alertPopup.then(function(res) {
                    $scope.newAddress = { label:"", address:"" };
                });
            }
        });
    }

    $scope.refreshAddressbook = function () {
        $scope.addressOffset = 0;
        $scope.addressArray = [];
        WalletService.getBookAddresses($scope.addressOffset, $scope.addressLimit).then(function (addressResultSet) {
            processAddressResult(addressResultSet);
        }).finally(function () {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });;
    }

    $scope.addressQrCode = function(addressRow){
        $log.debug("### addressQrCode: " + angular.toJson(addressRow) + " window width: " + window.screen.width);
        $scope.qrcodeData.address = addressRow.addrStr;
        $scope.qrcodeData.label = addressRow.label;
        // "casinocoin:Cd4i6sLGgZGwqShhv7TNHuWyP8kYnfR8eT?amount=1.00&label=Test%20Address";
        $scope.qrcodeSize = window.screen.width - (window.screen.width*0.25);
        $scope.qrcodeModal.show();
        // close option buttons when finished
        $ionicListDelegate.closeOptionButtons();
    }

    $scope.closeQRCodeModal = function () {
        $scope.qrcodeModal.hide();
    }

    $scope.makeQRCodeUrl = function () {
        return $scope.qrcodeData.protocol + ":" +
            $scope.qrcodeData.address + "?label=" +
            $filter('urlencode')($scope.qrcodeData.label) + "&amount=" +
            $filter('urlencode')($scope.qrcodeData.amount) + "&message=" +
            $filter('urlencode')($scope.qrcodeData.message);
    }

    $scope.addressLabel = function (addressRow) {
        $log.debug("### addressLabel: " + angular.toJson(addressRow));
        $scope.addressLabelObject = { label: addressRow.label || "" };
        $log.debug("### addressLabelObject: " + angular.toJson($scope.addressLabelObject));
        var labelPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="addressLabelObject.label">',
            title: $filter('translate')('l_edit_address_label'),
            subTitle: $filter('translate')('l_label'),
            scope: $scope,
            buttons: [
              { text: $filter('translate')('l_cancel') },
              {
                  text: '<b>'+$filter('translate')('l_save')+'</b>',
                  type: 'button-assertive',
                  onTap: function(e) {
                      return $scope.addressLabelObject.label;
                  }
              }
            ]
        });

        labelPopup.then(function (result) {
            $log.debug("### Popup Result: " + angular.toJson(result));
            if (result) {
                addressRow.label = result;
                WalletService.save();
                $scope.refreshAddressbook();
            }
            $ionicListDelegate.closeOptionButtons();
        });

    }

    $scope.addressDelete = function (addressRow) {
        $log.debug("### addressDelete: " + angular.toJson(addressRow));
        var confirmPopup = $ionicPopup.confirm({
            title: $filter('translate')('l_delete_address'),
            template: $filter('translate')('l_delete_address_desc')
        });

        confirmPopup.then(function(result) {
            if(result) {
                $log.debug("### Execute Delete: " + addressRow.address);
                // deactivate the address in the wallet
                WalletService.deleteBookAddress(addressRow);
                WalletService.save();
                $scope.refreshAddressbook();
            } else {
                $log.debug("### Delete canceled ###");
            }
            $ionicListDelegate.closeOptionButtons();
        });
    }

    $scope.addressShare = function (addressRow) {
        $log.debug("### addressShare: " + angular.toJson(addressRow));
        $scope.qrcodeData.address = addressRow.addrStr;
        $scope.qrcodeData.label = addressRow.label;
        $cordovaSocialSharing
        .share('CSC Shared Address', 'CSC Address', null, $scope.makeQRCodeUrl()) // Share via native share sheet
        .then(function (result) {
            $log.debug("### addressShare success: " + angular.toJson(result));
            $ionicListDelegate.closeOptionButtons();
        }, function (error) {
            $log.debug("### addressShare error: " + angular.toJson(error));
            $ionicListDelegate.closeOptionButtons();
        });
    }
})