'use strict';
// Check if user has a browser that supports Local Storage
var Modernizr;
if (!Modernizr.localstorage) {
	window.alert('Your browser doesn\'t support Local Storage, so you won\'t be able to use this webapp.\nTry using a modern web browser.');
}


$(document).ready(function() {
	window.sortIcon = '<i class="glyphicon glyphicon-move"></i>';

	$('.jumbotron .loading').fadeOut('fast', function() {
		$('#start').fadeIn('slow');
		window.start();
	});

	window.start = function() {
		window.load();
		$('.jumbotron').fadeOut('fast');
		$('#panel-form').disableSelection();
	};

	window.load = function() {
		if(localStorage.order) {
			// Finds out what was the last order of elements
			var dataArray = localStorage.getItem('order');
			dataArray = dataArray.split(',');

			// Creates a temp array to sort
			var tempArray = [];

			for(var i = 0; i < dataArray.length; i++) {
				tempArray.push(localStorage.getItem(dataArray[i]));
			}
			// Removes empty elements
			tempArray = tempArray.filter(function(e) { return e; });


			localStorage.clear();


			// Returns the final object with optimized sorting
			var finalObj = {};
			var tempOrder = [];
			for(var j = 0; j < tempArray.length; j++) {
				var key = 'slot-' + (j+1);
				finalObj[key] = tempArray[j];
				tempOrder.push(key);
			}
			localStorage.order = tempOrder.join();


			// Resets the localStorage and fills the elements panel
			$.each(finalObj,function(key, value){
				localStorage[key] = value;
				var temp = value.split('"');
				var type = temp[3];
				var wrapper = '<li title="' + type + '">';
				var removeIcon = '<a href="javascript:;" class="remove" data-id="' + key + '" title="Remove this element" onclick="removeElement(this)"><i class="">&times;</i>';
				var element = '<a href="javascript:;" class="icon icon-' + type + '"></a>';

				if(value) {
					$('#' + key)
						.html(wrapper + window.sortIcon + element + removeIcon + '</li>')
						.removeClass('free')
						.droppable('disable');
				}
			});
		}
	};



    // Dragging
	$('li', $('#element-list')).draggable({
		containment: 'document',
		cursor: 'move',
		helper: 'clone',
		revert: 'invalid',
		scroll: true,
		stop: function(){ window.list(); }
	});

	window.drag = function(draggable, droppableId) {
		var removeIcon = '<a href="javascript:;" class="remove" data-id="' + droppableId + '" title="Remove this element" onclick="removeElement(this)"><i class="">&times;</i>';
		draggable.clone().prepend(window.sortIcon).append(removeIcon).appendTo('#' + droppableId);
		$('#' + droppableId).removeClass('free').droppable('disable');
	};



    // Dropping
	$('.slot.free').droppable({
		accept: '#element-list > li',
		activeClass: 'dragging',
		drop: function(event, ui) {
			var droppableId = $(this).attr('id');
			window.drag(ui.draggable, droppableId);
		}
	});



	// Remove form input from slots
	window.removeElement = function(element) {
		$(element).parent().remove();
		var dataId = $(element).attr('data-id');
		$('#' + dataId).droppable('enable');
		$('.slot').removeClass('sort-placehold');
		localStorage.removeItem(dataId);
		window.list();
	};


	// Refresh the list order
	window.list = function() {
		var listArray = [];
		$('#panel-form div').each(function() { listArray.push($(this).attr('id')); });
		localStorage.order = listArray;
	};


	// Sorting
	$('#panel-form').sortable({
		handle: 'i',
		placeholder: 'sort-placehold',
		stop: function() { window.list(); }
	});



	// Change properties
	$('.slot').on('click','li a.icon',function() {
		$('a[href="#panel-prop"]').trigger('click');
		var slotId = $(this).parent().parent().attr('id');
		$('.slot').removeClass('sort-placehold');
		$(this).parent().parent().addClass('sort-placehold');
		$('#panel-prop form').removeClass('active');


		switch($(this).parent().attr('title')){
			case 'button':
				$('#form-prop-button').addClass('active');
				$('#current-slot').val(slotId);
				window.fillForm(slotId);
				break;
			case 'text':
				$('#form-prop-input').addClass('active');
				$('#current-slot').val(slotId);
				window.fillForm(slotId);
				break;
		}
	});
	window.fillForm = function(slotId) {
		$('#panel-prop form.active input[type=checkbox]').each(function() { $(this).removeAttr('checked'); });
		$('#panel-prop form.active')[0].reset();

		if(localStorage[slotId]) {
			var dataArray = $.parseJSON(localStorage[slotId]);
			$.each(dataArray,function(key, value){
				if($('#' + key).is(':checkbox')) {
					if(value === 'on') { $('#' + key).prop('checked', true); }
				} else {
					$('#' + key).val(value);
				}
			});
		}
	};



	// Auto-saves the properties to Local Storage
	$('#panel-prop').on('change',function() {
		var dataArray = $('#panel-prop form.active').serializeArray();
		var prettyArray = {};
		$(dataArray).each(function(index, field){ prettyArray[field.name] = field.value; });
		localStorage[$('#current-slot').val()] = JSON.stringify(prettyArray);
	});








/*
	$('#css').blur(function () {
		$('#saved').slideDown();
		window.setTimeout(function() {
			$('#saved').alert('close');
		}, 5000);
	});
*/
});