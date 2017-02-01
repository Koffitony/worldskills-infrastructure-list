'use strict';

/**
 * @ngdoc service
 * @name ilApp.Items
 * @description
 * # Items
 * Service in the ilApp.
 */
angular.module('ilApp')
  .service('Items', function ($q, $http, API_IL, ITEM_STATUS) {

   	var Items = { categories : $q.defer(), $data : $q.defer(), total: null };

   	Items.getCategories = function(skillId){
   		//if(typeof Items.categories.promise == 'undefined') Items.categories = $q.defer();
      Items.categories = $q.defer();

   		$http.get(API_IL + "/categories/" + skillId).then(function(result){
   			Items.categories.resolve(result.data.categories);
   			Items.categories = result.data.categories;
   		},
   		function(error){
   			Items.categories.reject("Could not fetch categories: " + error.data.user_msg);
   		});

   		return Items.categories.promise;
   	};

   	Items.getItems = function(categoryId, skillId, eventId, limit, offset, filter, canceler){
   		Items.data = $q.defer();

         var filterStr = (typeof filter != 'undefined') ? "&filter=" + filter : "";

   		$http.get(API_IL + "/items/" + eventId + "/skills/" + skillId + "/requested_items/" + categoryId + "?limit=" + limit + "&offset=" + offset + filterStr, {timeout: canceler.promise}).then(function(result){
   			Items.data.resolve(result.data);
   			Items.data = result.data;
   		},
   		function(error){
          if(typeof error.data == 'undefined') Items.data.reject("Could not get items, please contact webmaster@worldskills.org");
   		});

   		return Items.data.promise;
   	};

      Items.saveItem = function(item, eventId){
         var deferred = $q.defer();


         $http.put(API_IL + "/items/" + eventId + "/requested_items/" + item.id, item).then(function(result){
            deferred.resolve(result.data);
         },
         function(error){
            deferred.reject("Could not save requested item: " + error.data.user_msg);
         });

         return deferred.promise;
      };

      Items.removeItem = function(item, eventId){
         var deferred = $q.defer();

         //deleting children automatically in API if the parent gets deleted
         $http.delete(API_IL + "/items/" + eventId + "/requested_items/" + item.id).then(function(result){
            deferred.resolve(result.data);
         },
         function(error){
            deferred.reject("Could not remove requested item: " + error.data.user_msg);
         });

         return deferred.promise;
      };

      Items.linkItem = function(item, eventId){
         var deferred = $q.defer();

         var api = API_IL + "/items/" + eventId

         $http.post(api + "/requested_items/", item).then(function(result){
            deferred.resolve(result.data);
         },
         function(error){
            //delete supplied item orphan
            deferred.reject("Could not create a requested item, please try again. " + error.data.user_msg);
         });


         return deferred.promise;
      };


    Items.addItem = function(item, eventId){
         var deferred = $q.defer();

         var api = API_IL + "/items/" + eventId
         var supplied_item = {
            "user_generated": true, //generated by requested items view
            "event": { id: eventId},
            "status": { id: ITEM_STATUS.RED },
            "description": item.description
         };

         debugger;
        //add supplied item first if needed
        if(item.supplied_item === null){
          $http.post(api + "/supplied_items/", supplied_item).then(function(result){
            //supplied item created
            var new_supplied_item = result;

            //link supplied item
            item.supplied_item = result.data;

            $http.post(api + "/requested_items/", item).then(function(result){
                deferred.resolve(result.data);
              },
              function(error){
                //delete supplied item orphan
                $http.delete(api + "/supplied_items/" + new_supplied_item.data.id);
                deferred.reject("Could not create a requested item, please try again. " + error.data.user_msg);
              });
          },
          function(error){
            deferred.reject("Could not create a supplied item: " + error.data.user_msg);
          });
        }
        else{
          //supplied item already created
          $http.post(api + "/requested_items/", item).then(function(result){
              deferred.resolve(result.data);
            },
            function(error){
              //no need to delete supplied item orphan - as it already existed
              deferred.reject("Could not create a requested item, please try again. " + error.data.user_msg);
            });
        }

         return deferred.promise;
      };

      Items.moveItem = function(eventId, skillId, itemId, parentId, index){
         var deferred = $q.defer();

         $http.put(API_IL + "/items/" + eventId + "/requested_items/" + itemId + "/move?skill="+skillId+"&parent="+parentId+"&index="+index, {}).then(function(result){
            deferred.resolve(result);
         },
         function(error){
            deferred.reject(error.data.user_msg);
         });

         return deferred.promise;
      };

      Items.addSet = function(setId, categoryId, eventId){
        var deferred = $q.defer();

        $http.post(API_IL + "/items/" + eventId + "/requested_items/sets?set=" + setId + "&category=" + categoryId).then(function(res){
          deferred.resolve(res.data);
        },
        function(error){
          deferred.reject("Could not add set to the list: " + error.data.user_msg);
        });

        return deferred.promise;
      };

    Items.getCatalogue = function(eventId, filters){
      var deferred = $q.defer();

      var queryParams = "?search=";

      //skill filter
      if(filters.active && filters.skill && filters.skill.id != 'all')
        queryParams += "&skill=" + filters.skill.id;

      //category filter
      if(filters.active && filters.category && filters.category.id != 'all')
        queryParams += "&category=" + filters.category.id;

      $http.get(API_IL + "/items/" + eventId + "/catalogue/" + queryParams).then(function(res){
        deferred.resolve(res.data);
      },
      function(error){
        deferred.reject("Could not get catalogue items: " + error.data.user_msg);
      });

      return deferred.promise;
    };

    Items.getPublicItems = function(eventId, skillId){
      var deferred = $q.defer();

      $http.get(API_IL + '/public/items/' + eventId + '/skills/' + skillId + '/requested_items/').then(function(result) {
        deferred.resolve(result.data.requested_items);
      }, function(error) {
        deferred.reject(error.data.user_msg);
      });

      return deferred.promise;
    };

   	return Items;

  });
