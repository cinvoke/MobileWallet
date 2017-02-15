angular.module('casinocoin.controllers')

.controller('HomeCtrl', function ($scope, $rootScope, publicAPI, $log, $ionicSideMenuDelegate, insight) {
    // set application version
    $log.debug("### App Version: " + $rootScope.appVersion);
    $log.debug("### Security: " + angular.toJson($rootScope.security));
    $ionicSideMenuDelegate.canDragContent(true);
    // get api info on page show
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (toState.name == 'app.home') {
            // get the last Blocks from Insight
            insight.getBlocks().then(function (apiResult) {
                if (apiResult.status == 200) {
                    $rootScope.blocks = apiResult.data.blocks;
                    if ($rootScope.blocks.length > 0) {
                        $rootScope.blockheight = $rootScope.blocks[0].height;
                    }
                }
            })
            // get CoinInfo from API
            publicAPI.getCoinInfo().then(function (apiResult) {
                $log.debug("### CoinInfo: " + angular.toJson(apiResult));
                if (apiResult.status == 200) {
                    $rootScope.coinInfo = apiResult.data.Result.CoinInfo;
                    $rootScope.blockheight = $scope.coinInfo.Blockheight;
                }
            });
            // get new exchanges info data
            publicAPI.getActiveExchanges().then(function (apiResult) {
                $log.debug("### ActiveExchanges: " + angular.toJson(apiResult));
                if (apiResult.status == 200) {
                    $rootScope.activeExchanges = apiResult.data.Result.ActiveExchanges;
                }
            });
            $log.debug("### Security: " + JSON.stringify($scope.security));
        }
    });
});