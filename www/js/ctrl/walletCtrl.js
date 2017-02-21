angular.module('casinocoin.controllers')

.controller('WalletCtrl', function ($q, $rootScope, $scope, $ionicModal,
                                    $ionicTabsDelegate, $ionicLoading, 
                                    $http, $timeout, $cordovaClipboard,
                                    $cordovaBarcodeScanner, WalletService,
                                    $ionicPopup, insight, $log, $filter,
                                    $ionicSideMenuDelegate, $ionicListDelegate,
                                    $cordovaSocialSharing, $window, $state) {
    $log.debug("### WalletCtrl ###");
    // disable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(false);
    // Create the wallet creation modal that we will use later
    $ionicModal.fromTemplateUrl('templates/wallet/create-wallet.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### create wallet modal created");
        $scope.createWalletModal = modal;
    });

    // Create the PIN Pad modal that we will use later
    $ionicModal.fromTemplateUrl('templates/wallet/pinpad-dialog.html', {
        scope: $scope,
        animation: 'slide-in-down'
    }).then(function (modal) {
        $log.debug("### pinpad modal created");
        $scope.pinpadModal = modal;
    });

    // Create the QRCode modal that we will use later
    $ionicModal.fromTemplateUrl('templates/wallet/show-qrcode.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### show qrcode modal created");
        $scope.qrcodeModal = modal;
    });

    // Create the AddressTx modal that we will use later
    $ionicModal.fromTemplateUrl('templates/wallet/show-address-tx.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### show address tx modal created");
        $scope.addressTxModal = modal;
    });

    $scope.closeAddressTxModal = function () {
        $scope.addressTxModal.hide();
    }

    // disable block toast messages
    $rootScope.showBlockToast = false;
    // init vars
    $scope.walletCreationChoice = { value: "GENERATED" };
    $scope.walletPassPhrase = {};
    $scope.wallet = null;
    $scope.walletBalance = 0;
    $scope.unconfirmedWalletBalance = 0;
    $scope.walletTransactionCount = 0;
    $scope.sendCoinsRequest = {};
    $scope.PIN = "";
    $scope.PINCompleteCallback = null;
    $scope.walletReceiveAddresses = [];
    $scope.initialPIN = false;

    // navigate to default tab on page show
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $log.debug("### toState: " + toState.name + " fromState: " + fromState.name);

        if (toState.name == 'app.wallet') {
            // navigate to app.wallet.home tab
            $ionicTabsDelegate.$getByHandle('wallet-tabs').select(1);
            if ($scope.wallet) {
                $rootScope.$emit("UpdateWalletValues", {});
            }
        }
/*
        } else if (toState.name == 'app.wallet.home') {
            // select tab index 1
            $timeout(function () {
                $ionicTabsDelegate.$getByHandle('wallet-tabs').select(1);
            }, 0);
            // enable sidemenu swipe
            $ionicSideMenuDelegate.canDragContent(true);
            // update wallet values if we have a wallet
            if ($scope.wallet) {
                $rootScope.$emit("UpdateWalletValues", {});
            }
        } else if (toState.name == 'app.wallet.send') {
            // select tab index 0
            $timeout(function () {
                $ionicTabsDelegate.$getByHandle('wallet-tabs').select(0);
            }, 0);
            // enable sidemenu swipe
            $ionicSideMenuDelegate.canDragContent(true);
        } else if (toState.name == 'app.wallet.receive') {
            // select tab index 2
            $timeout(function () {
                $ionicTabsDelegate.$getByHandle('wallet-tabs').select(2);
            },0);
            // disable sidemenu swipe
            $ionicSideMenuDelegate.canDragContent(false);
        }
*/
    });

    $scope.PINCompleteOnCreate = function (pincode) {
        $scope.PIN = pincode;
        $scope.pinpadModal.hide().then(function () {
            $log.debug("### Final PIN: " + $scope.PIN);
            WalletService.createWallet($scope.walletPassPhrase.value).then(function (wallet) {
                $scope.wallet = wallet;
                $scope.createWalletModal.hide();

                // Subscribe to insight api after wallet creation (the same is done on wallet loading in app.js)
                angular.forEach($scope.wallet.addresses, function (walletAddress) {
                    $log.debug("### walletAddress to subscribe to: " + JSON.stringify(walletAddress));
                    WalletService.subscribeWalletTX(walletAddress.address);
                });

                // wallet created and loaded, encrypt keys
                if ($scope.wallet) {
                    WalletService.encryptWalletKeys($scope, $scope.PIN).then(
                        function () {
                            $log.debug("### encryptWalletKeys Finished");
                            $log.debug("### Wallet: " + JSON.stringify($scope.wallet));
                            $rootScope.$emit("UpdateWalletValues", {});
                        }, function (error) {
                            $log.debug("### encryptWalletKeys Error: " + JSON.stringify(error));
                        }
                    );
                }
            }, function (error) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Error!',
                    template: '<p>There was an error creating the wallet:</p><p>'+error+'</p>',
                    buttons: [{
                        text: 'Ok',
                        type: 'button-assertive'
                    }]
                });
            });
        });
    }
    
    // If rootScope.wallets was loaded and contains wallet data it will be shown
    // Otherwise scope.wallet will remain null and the create wallet modal will
    // be shown from the wallet/tab-home view
    if($rootScope.wallets){
        $log.debug("### rootScope.wallets: " + JSON.stringify($rootScope.wallets.data));
        if ($rootScope.wallets.data.length == 1) {
            $scope.wallet = $rootScope.wallets.data[0];
        } else if ($rootScope.wallets.data.length > 1) {
            // need to handle multiple wallets
            $log.debug('### Multiple Wallets !!!! ###');
            $scope.wallet = $rootScope.wallets.data[0];
        }
    }

    $scope.processWalletCreationChoice = function () {
        // set initial PIN = true for PIN pad text
        $scope.initialPIN = true;
        $log.debug("### Wallet Creation Choice: " + angular.toJson($scope.walletCreationChoice));
        if ($scope.walletCreationChoice.value == 'GENERATED') {
            // generate a seed
            $scope.walletPassPhrase.value = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(64));
            $log.debug("### Random Seed: " + $scope.walletPassPhrase.value);
            $scope.doCreateWallet($scope.walletPassPhrase.value);
        } else {
            $scope.createWalletModal.show();
        }
    }

    // Triggered to close the createWalletModal
    $scope.closeCreateWalletModal = function () {
        $scope.createWalletModal.hide();
    };

    // Triggered to copy the default address to the clipboard
    $scope.copyWalletAddress = function (address){
        $cordovaClipboard.copy(address);
    }

    // Triggered to create new wallet
    $scope.doCreateWallet = function (passPhrase) {
        $scope.createWalletModal.hide().then(function () {
            $scope.PINCompleteCallback = $scope.PINCompleteOnCreate;
            // show the PIN modal
            $scope.pinpadModal.show();
        });
    }

    $rootScope.$on("UpdateWalletValues", function () {
        $scope.updateWalletValues();
    });

    $scope.updateWalletValues = function () {
        $log.debug("### Update Wallet Values ###");
        // Load Wallet Address info from Insight API
        WalletService.getReceiveAddresses().then(function (receiveAddresses) {
            var balance = 0;
            var unconfirmedBalance = 0;
            var txCount = 0;
            var promises = [];
            angular.forEach(receiveAddresses.data, function (value) {
                // create promise and add to array
                var deferred = $q.defer();
                promises.push(deferred.promise);
                // get address object
                insight.getAddress(value.addrStr).then(
                    function (response) {
                        // copy service values onto db object
                        angular.extend(value, response.data);
                        // update totals and tx count
                        balance = balance + value.balance;
                        unconfirmedBalance = unconfirmedBalance + value.unconfirmedBalance;
                        txCount = txCount + value.txApperances + value.unconfirmedTxApperances;
                        // update address info in wallet db
                        WalletService.updateReceiveAddress(value);
                        // resolve current promise
                        deferred.resolve();
                    }
                );
            });
            $q.all(promises).then(function () {
                $log.debug("### All resolved -> after forEach receiveAddresses ###");
                // $scope.loadingInProgress = false;
                $scope.walletBalance = balance;
                if (unconfirmedBalance < 0)
                    $scope.walletBalance += unconfirmedBalance;
                $scope.unconfirmedWalletBalance = unconfirmedBalance;
                $scope.walletTransactionCount = txCount;
                WalletService.getReceiveAddresses().then(function (updatedReceiveAddresses) {
                    $log.debug("### Updated ReceiveAddresses: " + angular.toJson(updatedReceiveAddresses));
                    $log.debug("### Wallet: " + angular.toJson($scope.wallet));
                    $scope.walletReceiveAddresses = updatedReceiveAddresses.data;
                });
                // Stop the ion-refresher from spinning
                $scope.$broadcast('scroll.refreshComplete');
            });
        });
        
    }

    $scope.totalBalance = function(value){
        var totalBalance = 0;
        WalletService.getReceiveAddresses().then(function (receiveAddresses) {
            receiveAddresses.data.forEach(function (item) {
                totalBalance = totalBalance + item.balance;
            });
            if (!angular.isDefined(value)) {
                return totalBalance;
            }
        });
    }

    $scope.PINCompleteOnSendCoins = function (pincode) {
        $scope.PIN = pincode;
        $scope.pinpadModal.hide().then(function () {
            $log.debug("### Final PIN: " + $scope.PIN);
            // decrypt wallet keys
            WalletService.decryptWalletKeys($scope, $scope.PIN).then(
                function () {
                    $log.debug("### decryptWalletKeys Finished");
                    $log.debug("### Wallet: " + JSON.stringify($scope.wallet));
                    WalletService.sendCoins($scope.wallet, $scope.sendCoinsRequest).then(function (txid) {
                        $log.debug("### Send Success: " + txid);
                        $scope.sendForm.$setPristine();
                        $scope.sendCoinsRequest = {};
                        $rootScope.$emit("UpdateWalletValues", {});
                        $state.go('app.wallet.home');
                        var alertPopup = $ionicPopup.alert({
                            title: 'Success!',
                            template: 'The transaction was broadcasted successfully to the network with transaction id: ' + txid,
                            buttons: [{
                                text: 'Ok',
                                type: 'button-assertive'
                            }]
                        });
                    }, function (errorMsg) {
                        $log.debug("## Send Error: " + errorMsg);
                        $scope.sendCoinsRequest = {};
                        var alertPopup = $ionicPopup.alert({
                            title: 'Error Sending Coins',
                            template: '<p>There was an error sending the coins:</p>' + errorMsg,
                            buttons: [{
                                text: 'Ok',
                                type: 'button-assertive'
                            }]
                        });
                    });
                }, function (error) {
                    $log.debug("### decryptWalletKeys Error: " + JSON.stringify(error));
                }
            );
        });
    }

    $scope.doSendCoins = function (sendCoinsRequest, sendForm) {
        $log.debug("### sendRequest: " + JSON.stringify(sendCoinsRequest));
        $scope.PIN = "";
        $scope.sendCoinsRequest = sendCoinsRequest;
        $scope.sendForm = sendForm;
        $scope.PINCompleteCallback = $scope.PINCompleteOnSendCoins;
        // show the PIN modal
        $scope.pinpadModal.show();
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
                      $scope.sendCoinsRequest.toAddress = sendAddress;
                  }
                  // get amount if specified
                  var amountStringStart = barcodeData.text.indexOf("amount=");
                  if (amountStringStart > 0) {
                      var amountString = barcodeData.text.substring(amountStringStart);
                      var amountStart = amountString.indexOf("=") + 1;
                      var amountEnd = amountString.indexOf("&");
                      if (amountEnd < 0) {
                          amountEnd = amountString.length;
                      }
                      $scope.sendCoinsRequest.amount = Number(amountString.substring(amountStart, amountEnd));
                  }
              }
          }, function (error) {
              // An error occurred
              $log.error("### barcode error: " + JSON.stringify(error));
          });
    }

    $scope.sendAllCoins = function () {
        var sendCoinValue = $scope.walletBalance.toFixed(8) - $rootScope.fees;
        if (sendCoinValue > 0) {
            $scope.sendCoinsRequest.amount = sendCoinValue;
        } else {
            $scope.sendCoinsRequest.amount = 0;
        }
    }

    $scope.PINCompleteOnAddNewAddress = function (pincode) {
        $scope.PIN = pincode;
        $scope.pinpadModal.hide().then(function () {
            $log.debug("### Final PIN Add Address: " + $scope.PIN);
            WalletService.addNewWalletAddress($scope, $scope.PIN).then(function (result) {
                $log.debug("### New addres created: " + angular.toJson(result));
                $log.debug("### Wallet: " + angular.toJson($scope.wallet));
                // Subscribe to insight api after wallet address creation
                WalletService.subscribeWalletTX(result.address);
                $rootScope.$emit("UpdateWalletValues", {});
            }, function (error) {
                $log.error("### Error creating new addres: " + angular.toJson(error));
                var alertPopup = $ionicPopup.alert({
                    title: 'Error Creating Address',
                    template: '<p>There was an error creating a new address. Please verify that you entered the correct PIN.</p>',
                    buttons: [{
                        text: 'Ok',
                        type: 'button-assertive'
                    }]
                });
            });
        });
    }

    $scope.addNewAddress = function () {
        $log.debug("### addNewAddress ###");
        $scope.PIN = "";
        $scope.PINCompleteCallback = $scope.PINCompleteOnAddNewAddress;
        // show the PIN modal
        $scope.pinpadModal.show();
    }

    $scope.qrcodeData = {
        protocol: "casinocoin",
        address: "",
        label: "",
        amount: 0,
        message: ""
    };

    $scope.makeQRCodeUrl = function () {
        return $scope.qrcodeData.protocol + ":" +
            $scope.qrcodeData.address + "?label=" +
            $filter('urlencode')($scope.qrcodeData.label) + "&amount=" +
            $filter('urlencode')($scope.qrcodeData.amount) + "&message=" +
            $filter('urlencode')($scope.qrcodeData.message);
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


    $scope.addressLabel = function (addressRow) {
        $log.debug("### addressLabel: " + angular.toJson(addressRow));
        $scope.addressLabelObject = { label: addressRow.label || "" };
        $log.debug("### addressLabelObject: " + angular.toJson($scope.addressLabelObject));
        var labelPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="addressLabelObject.label">',
            title: 'Edit Address Label',
            subTitle: 'Label',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                  text: '<b>Save</b>',
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
            }
            $ionicListDelegate.closeOptionButtons();
        });

    }

    $scope.addressDelete = function (addressRow) {
        $log.debug("### addressDelete: " + angular.toJson(addressRow));
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete Address?',
            template: 'Are you sure you want to delete this address from your receive addresses? Any coins on your address balance will be moved to your default address.'
        });

        confirmPopup.then(function(result) {
            if(result) {
                $log.debug("### Execute Delete: " + addressRow.addrStr);
                // deactivate the address in the wallet

                WalletService.deleteReceiveAddress(addressRow, $scope.wallet);
                WalletService.save();
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

    $scope.isDefaultAddress = function (addressString) {
        if ($scope.wallet.addresses[0].address == addressString) {
            return true;
        } else {
            return false;
        }
    }

    $scope.showAddressTransactions = function (addressRow) {
        WalletService.getAddressTransactions(addressRow).then(function (result) {
            $scope.txAddress = addressRow.addrStr;
            $scope.txArray = result;
            $scope.addressTxModal.show();
        });
    }

});