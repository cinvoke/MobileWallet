angular.module('casinocoin.controllers')

.controller('SettingsCtrl', function ($rootScope, $scope, $log, $localStorage) {
    $log.debug("### SettingsCtrl ###");
    // load settings
    $scope.$settings = $localStorage;
});