angular.module('casinocoin.controllers')

.controller('TransactionsCtrl', function ($scope, $log, WalletService) {
    $log.debug("### TransactionsCtrl ###");
    $scope.moreDataCanBeLoaded = true;
    $scope.txOffset = 0;
    $scope.txLimit = 10;
    $scope.txArray = [];

    $scope.getAllTransactions = function () {
        $log.debug("### getAllTransactions - offset: " + $scope.txOffset + " limit: " + $scope.txLimit);
        WalletService.getTransactions($scope.txOffset, $scope.txLimit).then(function (txResultSet) {
            $log.debug("### txResultSet count: " + txResultSet.length);
            angular.extend($scope.txArray, txResultSet);
        });
    }

    $scope.$on('modal.shown', function (event, modal) {
        if (modal.id == 'transactionsModal') {
            $log.debug('### Modal ' + modal.id + ' is shown!');
            $scope.getAllTransactions();
        }
    });

    $scope.loadMoreTransactions = function () {
        $scope.txOffset += $scope.txLimit;
        $log.debug("### Load more TX - offset: " + $scope.txOffset + " limit: " + $scope.txLimit);
        WalletService.getTransactions($scope.txOffset, $scope.txLimit).then(function (txResultSet) {
            $log.debug("### txResultSet count: " + txResultSet.length);
            if (txResultSet.length > 0) {
                $log.debug("### txArray Before: " + $scope.txArray.length);
                angular.forEach(txResultSet, function(newTx){
                    $scope.txArray.push(newTx);
                });
                if (txResultSet.length < $scope.txLimit) {
                    $scope.moreDataCanBeLoaded = false;
                }
                $log.debug("### txArray After: " + $scope.txArray.length);
            } else {
                $scope.moreDataCanBeLoaded = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    }

    $scope.closeTransactionsModal = function () {
        $scope.transactionsModal.hide();
    }

    $scope.updateTransactions = function () {
        $scope.txOffset = 0;
        WalletService.getTransactions($scope.txOffset, $scope.txLimit).then(function (txResultSet) {
            $log.debug("### txResultSet count: " + txResultSet.length);
            $scope.txArray = txResultSet;
        }).finally(function () {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });;
    }
})