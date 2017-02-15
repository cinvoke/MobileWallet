// CONTROLLERS
angular.module('casinocoin.controllers', ['ionic','casinocoin.services'])

.controller('AddressbookCtrl', function ($scope, $log, $ionicSideMenuDelegate) {
    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);
    $log.debug("### AddressbookCtrl ###");
})

.controller('TransactionsCtrl', function ($scope, $log, $ionicSideMenuDelegate) {
    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);
    $log.debug("### TransactionsCtrl ###");
});
