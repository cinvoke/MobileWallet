angular.module('casinocoin.controllers')

.controller('ExchangesCtrl', function ($rootScope, $scope, $log, publicAPI, $ionicSideMenuDelegate, $cordovaInAppBrowser) {
    $log.debug("### ExchangesCtrl ###");
    // enable sidemenu swipe
    $ionicSideMenuDelegate.canDragContent(true);
    // refresh exchanges information
    $scope.updateActiveExchanges = function () {
        $log.debug("### updateActiveExchanges() ###");
        publicAPI.getActiveExchanges().then(function (apiResult) {
            if (apiResult.status == 200) {
                $rootScope.activeExchanges = apiResult.data.Result.ActiveExchanges;
            }
        }).finally(function () {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });
    }

    $scope.openExchangeURL = function (url) {
        $log.debug("### openExchangeURL: " + url);
        var options = {
            location: 'yes',
            clearcache: 'yes',
            toolbar: 'no'
        };
        $cordovaInAppBrowser.open(url, '_blank', options)
          .then(function (event) {
              // success
          })
          .catch(function (event) {
              // error
          });
    }

});