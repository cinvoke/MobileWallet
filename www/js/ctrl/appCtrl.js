angular.module('casinocoin.controllers')

.controller('AppCtrl', function ($scope, $state, $ionicModal, $ionicPopup,
                                 $timeout, oauth2, publicAPI, $translate,
                                 ngToast, $log, $ionicSideMenuDelegate) {

    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Global CoinInfo object
    $scope.coinInfo = {};
    // Form data for the login modal
    $scope.loginData = {
        "email": "",
        "password": ""
    };
    // Form data for the registration modal
    $scope.registrationData = {
        "firstname": "",
        "lastname": "",
        "email": "",
        "password": ""
    };

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/security/login.html', {
        id: 'loginModal',
        scope: $scope
    }).then(function (modal) {
        $scope.loginModal = modal;
    });

    // Create the Addressbook modal that we will use later
    $ionicModal.fromTemplateUrl('templates/modals/addressbook.html', {
        id: 'addressbookModal',
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### show addressbook modal created");
        $scope.addressbookModal = modal;
    });

    // Create the Transactions modal that we will use later
    $ionicModal.fromTemplateUrl('templates/modals/transactions.html', {
        id: 'transactionsModal',
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $log.debug("### show transactions modal created");
        $scope.transactionsModal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.loginModal.hide();
    };

    // Open the login modal
    $scope.login = function () {
        $scope.loginModal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
        $log.debug('### Doing login', JSON.stringify($scope.loginData));
        // call oauth2 service with username and password
        oauth2.getToken($scope.loginData.email, $scope.loginData.password).then(function (oauth2Result) {
            if (oauth2Result.status == 200) {
                $log.debug("### Login Success: " + JSON.stringify(oauth2Result));
                $scope.security.authenticated = true;
                $scope.security.access_token = oauth2Result.data.access_token;
                $scope.security.refresh_token = oauth2Result.data.refresh_token;
                $scope.security.useremail = $scope.loginData.email;
                //$scope.stompClient.connect(null, null, function(frame) {
                //    $log.debug("[STOMP] Connect Success: " + frame);
                //}, function (frame) {
                //    $log.debug("[STOMP] Connect Error: " + frame);
                //});
                $scope.closeLogin();
                $state.go("app.wallet");
            } else {
                $log.debug("### Login Error: " + JSON.stringify(oauth2Result));
                $scope.loginData.password = "";
                if (oauth2Result.data.error_description === "17001") {
                    $scope.loginData.email = "";
                    // Show alert dialog
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('l_error'),
                        template: $translate.instant('l_email_not_exist')
                    });

                    alertPopup.then(function (res) {
                        $log.debug('### alert dismissed');
                    });
                } else {
                    // Show alert dialog
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('l_error'),
                        template: oauth2Result.data.error_description
                    });

                    alertPopup.then(function (res) {
                        $log.debug('### alert dismissed');
                    });
                }
            }
        });
        //    $timeout(function() {    
        //    }, 1000);
    };

    // Perform the logout action
    $scope.doLogout = function () {
        $log.debug('### Doing logout ###');
        $scope.security.authenticated = false;
        $scope.security.access_token = "";
        $scope.security.refresh_token = "";
        $state.go("app.home");
    };

    // Create the registration modal that we will use later
    $ionicModal.fromTemplateUrl('templates/security/registration.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.registrationModal = modal;
    });

    // Open the registration modal
    $scope.registration = function () {
        $scope.registrationModal.show();
    };

    // Triggered in the registration modal to close it
    $scope.closeRegistration = function () {
        $scope.registrationModal.hide();
        $scope.modal.hide();
        $state.go("app.home");
    };

    // Perform the registration action when the user submits the registration form
    $scope.doRegistration = function () {
        $log.debug('Doing registration: ', JSON.stringify($scope.registrationData));
        publicAPI.registerUser($scope.registrationData).then(function (registerResult) {
            if (registerResult.status == 200) {
                $log.debug("### Registration Success: " + JSON.stringify(registerResult));
                // Show alert dialog
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('l_success'),
                    template: $translate.instant('l_reg_success'),
                    buttons: [{
                        text: $translate.instant('l_ok'),
                        type: 'button-assertive'
                    }]
                });

                alertPopup.then(function (res) {
                    $log.debug('### alert dismissed');
                    $scope.closeRegistration();
                });
            } else {
                $log.error("### Registration Error: " + JSON.stringify(registerResult));
            }
        });
    };

});