var MyApp = angular.module('MyApp', []);
MyApp.controller('AppCtrl', ['$scope', function($scope){
	$scope.contactlist =[ {
					  name: 'Abdu',
					  email: 'abdu@live.com',
					  number: '444 555 6666'
			      },
			      {		
                                          name: 'Abdus',
                                          email: 'abdus@live.com',
                                          number: '444 333 6666'
                               },
			      {
                                          name: 'Abdul',
                                          email: 'abdul@live.com',
                                          number: '444 222 6666'
                               }
			     ];
}]);



