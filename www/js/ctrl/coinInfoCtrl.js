angular.module('casinocoin.controllers')

.controller('CoinInfoCtrl', function ($rootScope, $scope, $log, publicAPI, $ionicSideMenuDelegate) {
    $log.debug("### CoinInfoCtrl ###");
    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);
    // refresh coin information
    $scope.updateCoinInfo = function () {
        $log.debug("### updateCoinInfo() ###");
        publicAPI.getCoinInfo().then(function (apiResult) {
            $log.debug("### CoinInfo: " + JSON.stringify(apiResult));
            if (apiResult.status == 200) {
                $rootScope.coinInfo = apiResult.data.Result.CoinInfo;
                $rootScope.blockheight = $scope.coinInfo.Blockheight;
            }
        }).finally(function () {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    }
});