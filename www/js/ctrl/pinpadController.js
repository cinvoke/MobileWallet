angular.module('pinpad', ['ionic'])

.controller('PinpadCtrl', function ($scope, $rootScope, $log, publicAPI) {
    $log.debug("### PinpadCtrl");
    $scope.codes = {};

    function resetPIN() {
        $scope.pinpadPIN = "";
        $scope.codes.PIN1 = "";
        $scope.codes.PIN2 = "";
        $scope.codes.PIN3 = "";
        $scope.codes.PIN4 = "";
    }

    // initialize PIN
    resetPIN();

    $scope.addPINNumber = function (addNumber) {
        var pinLength = $scope.pinpadPIN.length;
        if (pinLength < 4) {
            $scope.pinpadPIN = $scope.pinpadPIN + addNumber;
        }
        if (pinLength == 0) {
            $scope.codes.PIN1 = addNumber;
        } else if (pinLength == 1) {
            $scope.codes.PIN2 = addNumber;
        } else if (pinLength == 2) {
            $scope.codes.PIN3 = addNumber;
        } else if (pinLength == 3) {
            $scope.codes.PIN4 = addNumber;
        }
    }

    $scope.removePINNumber = function () {
        var pinLength = $scope.pinpadPIN.length;
        if (pinLength == 1) {
            $scope.codes.PIN1 = "";
        } else if (pinLength == 2) {
            $scope.codes.PIN2 = "";
        } else if (pinLength == 3) {
            $scope.codes.PIN3 = "";
        } else if (pinLength == 4) {
            $scope.codes.PIN4 = "";
        }
        $scope.pinpadPIN = $scope.pinpadPIN.substr(0, $scope.pinpadPIN.length - 1);
    }

    $scope.executePinOk = function () {
        $log.debug("### PIN Code OK");
        $scope.PINCompleteCallback($scope.pinpadPIN);
        resetPIN();
    }

    $scope.closePINPadModal = function () {
        $log.debug("### PIN Pad Closed");
        $scope.pinpadModal.hide();
    }
})