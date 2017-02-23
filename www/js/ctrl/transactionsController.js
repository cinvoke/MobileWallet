angular.module('casinocoin.controllers')

.controller('TransactionsCtrl', function ($scope, $log, WalletService) {
    $log.debug("### TransactionsCtrl ###");
    $scope.noMoreScroll = true;
    $scope.txOffset = 0;
    $scope.txLimit = 10;
    $scope.txArray = [];

    function processTxResult(txResultSet){
        if (txResultSet.length > 0) {
            $log.debug("### txArray Before: " + $scope.txArray.length);
            angular.forEach(txResultSet, function(newTx){
                $scope.txArray.push(newTx);
            });
            if (txResultSet.length >= $scope.txLimit) {
                $scope.noMoreScroll = false;
            }
            $log.debug("### txArray After: " + $scope.txArray.length);
        } else {
            $scope.noMoreScroll = true;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
    }

    $scope.getAllTransactions = function () {
        $log.debug("### getAllTransactions - offset: " + $scope.txOffset + " limit: " + $scope.txLimit);
        WalletService.getTransactions($scope.txOffset, $scope.txLimit).then(function (txResultSet) {
            $log.debug("### txResultSet count: " + txResultSet.length);
            processTxResult(txResultSet);
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
            processTxResult(txResultSet);
        });
    }

    $scope.closeTransactionsModal = function () {
        $scope.transactionsModal.hide();
    }

    $scope.refreshTransactions = function () {
        $scope.txOffset = 0;
        $scope.txArray = [];
        WalletService.getTransactions($scope.txOffset, $scope.txLimit).then(function (txResultSet) {
            processTxResult(txResultSet);
        }).finally(function () {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
        });;
    }
})