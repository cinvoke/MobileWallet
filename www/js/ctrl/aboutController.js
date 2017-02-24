angular.module('casinocoin.controllers')

.controller('AboutCtrl', function ($scope, $log, $ionicModal) {
    $log.debug("### AboutCtrl ###");

    $scope.$on('modal.shown', function (event, modal) {
        if (modal.id == 'aboutModal') {
            $log.debug('### Modal ' + modal.id + ' is shown!');
        }
    });

    $scope.closeAboutModal = function () {
        $scope.aboutModal.hide();
    }

})