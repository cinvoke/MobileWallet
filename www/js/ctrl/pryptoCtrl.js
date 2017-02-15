angular.module('casinocoin.controllers')

.controller('PryptoCtrl', function ($rootScope, $scope, $state, $http, $cordovaBarcodeScanner, $ionicPopup, $log, WalletService) {
    $log.debug("### PryptoCtrl ###");
    $scope.wallet = $rootScope.wallets.data[0];
    // Define redeem object
    $scope.redeem = {
        securityCode: "",
        pryptoCode: "",
        value: 0,
        status: -1,
        active: -1,
        coinLogo: "img/csc-logo.png",
        coinName: "Casinocoin",
        coin: "CSC",
        walletAddress: WalletService.getDefaultAddress(),
        txID: ""
    };
    // define scanBarcode
    $scope.scanPryptoCard = function () {
        $cordovaBarcodeScanner
      .scan()
      .then(function (barcodeData) {
          // Success! Barcode data is here
          console.log("### barcodeData: " + JSON.stringify(barcodeData));
          // Security Code
          var scStart = barcodeData.text.indexOf('sc=') + 3;
          var scEnd = barcodeData.text.indexOf('&', scStart);
          if (scEnd == -1) {
              scEnd = barcodeData.text.length;
          }
          var sc = barcodeData.text.substring(scStart, scEnd);
          // Prypto Code
          var pcStart = barcodeData.text.indexOf('pc=') + 3;
          var pcEnd = barcodeData.text.indexOf('&', pcStart);
          if (pcEnd == -1) {
              pcEnd = barcodeData.text.length;
          }
          var pc = barcodeData.text.substring(pcStart, pcEnd);
          // Coin
          var coinStart = barcodeData.text.indexOf('&c=') + 3;
          var coinEnd = barcodeData.text.indexOf('&', coinStart);
          if (coinEnd == -1) {
              coinEnd = barcodeData.text.length;
          }
          var coin = barcodeData.text.substring(coinStart, coinEnd);
          // save data
          $scope.redeem.securityCode = sc;
          $scope.redeem.pryptoCode = pc;
          $scope.redeem.coin = coin;
          console.log("### security code: " + sc + " prypto code: " + pc + " coin: " + coin);
          $scope.validatePryptoCard();
      }, function (error) {
          // An error occurred
          console.log("### barcode error: " + error);
      });
    };

    // call validation service
    $scope.validatePryptoCard = function () {
        console.log('### Redeem Doing validate: ', $scope.redeem.securityCode);
        var token = "35616ab118fa557b77fdac78ef09d5632d302609";
        // call validate rest service
        $http.get("https://prypto.com/merchants/api/", { params: { "T": "SC", "TKN": token, "SC": $scope.redeem.securityCode } })
            .success(function (data) {
                $log.debug("### Prypto Result: " + angular.toJson(data));
                var status = data.substring(0, 1);
                var active = data.substring(2, 3);
                console.log("### validate result - status: " + status + " - active: " + active);
                // save status and active
                if (status == 0) {
                    $scope.redeem.status = { text: "Not Been Used", cssClass: "plus-card-value" };
                } else {
                    $scope.redeem.status = { text: "Already Used", cssClass: "min-card-value" };
                }
                if (active == 0) {
                    $scope.redeem.active = { text: "Card Not Activated", cssClass: "min-card-value" };
                } else {
                    $scope.redeem.active = { text: "Card Activated", cssClass: "plus-card-value" };
                }
                // set coin logo
                if ($scope.redeem.coin == "BTC") {
                    $scope.redeem.coinLogo = "img/btc-logo.png";
                    $scope.redeem.coinName = "Bitcoin";
                } else if ($scope.redeem.coin == "DOGE") {
                    $scope.redeem.coinLogo = "img/doge-logo.png";
                    $scope.redeem.coinName = "Dogecoin";
                } else {
                    $scope.redeem.coinLogo = "img/csc-logo.png";
                    $scope.redeem.coinName = "Casinocoin";
                }
                console.log("### $scope.redeem: " + JSON.stringify($scope.redeem));
                // check status and active if card can still be redeemed
                if (status == 0 && active == 1) {
                    $rootScope.redeem = $scope.redeem;
                    $state.go("app.redeemToWallet");
                } else {
                    $scope.validate = $scope.redeem;
                    $scope.showValidateResult();
                }
            })
            .error(function (error) {
                alert("Error");
            });
    }

    // Show validation result
    $scope.showValidateResult = function () {
        var resultPopup = $ionicPopup.alert({
            title: "Validation Result",
            scope: $scope,
            templateUrl: "templates/validationResult.html",
            cssClass: "custom-popup",
            buttons: [
                { text: "Ok", type: "button-dark" }
            ]
        });
        resultPopup.then(function (res) {
            console.log("### Alert Closed ###");
            // reset validate object
            $scope.validate = {
                securityCode: "",
                pryptoCode: "",
                value: 0,
                status: -1,
                active: -1,
                coinLogo: "",
                walletAddress: "",
                txID: ""
            };
        });
    }

    // define scanBarcode
    $scope.scanWalletAddress = function () {
        // save redeem to scope
        $scope.redeem = $rootScope.redeem;
        // start scanner
        $cordovaBarcodeScanner
      .scan()
      .then(function (barcodeData) {
          // Success! Barcode data is here
          console.log("### barcodeData: " + JSON.stringify(barcodeData));
          var walletStart = barcodeData.text.indexOf(':') + 1;
          var walletEnd = barcodeData.text.indexOf('?');
          $scope.redeem.walletAddress = barcodeData.text.substring(walletStart, walletEnd);
      }, function (error) {
          // An error occurred
          console.log("### barcode error: " + error);
      });
    }

    // call redeem service
    $scope.redeemPryptoCard = function () {
        console.log('### Redeem to wallet: ' + JSON.stringify($scope.redeem));
        var token = "35616ab118fa557b77fdac78ef09d5632d302609";
        // call validate rest service
        $http.get("https://prypto.com/merchants/api/", {
            params: {
                "T": "RX",
                "TKN": token,
                "COIN": $scope.redeem.coin,
                "PC": $scope.redeem.pryptoCode,
                "SC": $scope.redeem.securityCode,
                "RX": $scope.redeem.walletAddress
            }
        })
            .success(function (data) {
                if (data.length > 0) {
                    $scope.redeem.txID = data;
                    console.log("### redeem txID: " + $scope.redeem.txID);
                    var resultPopup = $ionicPopup.alert({
                        title: "Redeem Result",
                        template: "Card succesfully redeemed with transaction id: " + $scope.redeem.txID,
                        cssClass: "custom-popup",
                        buttons: [
                            { text: "Ok", type: "button-dark" }
                        ]
                    });
                    resultPopup.then(function (res) {
                        // show home
                        $state.go("app.wallet.home");
                    });
                } else {
                    console.log("### Card could not be redeemed");
                    var resultPopup = $ionicPopup.alert({
                        title: "Redeem Result",
                        template: "Error redeeming Prypto Card",
                        cssClass: "custom-popup",
                        buttons: [
                            { text: "Ok", type: "button-dark" }
                        ]
                    });
                    //resultPopup.then(function (res) {
                    //    // show home
                    //    $state.go("app.home");
                    //});
                }
            })
            .error(function (error) {
                alert("### redeem error: " + error);
            });
    }
});