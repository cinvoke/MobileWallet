angular.module('casinocoin.controllers')

.controller('BlockchainCtrl', function ($rootScope, $scope, $log, $ionicSideMenuDelegate) {
    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);
    $log.debug("### BlockChainCtrl - blocks: " + JSON.stringify($rootScope.blocks));
});