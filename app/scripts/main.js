'use strict';
// Check if user has a browser that supports Local Storage
var Modernizr;
if (!Modernizr.localstorage) {
	window.alert('Your browser doesn\'t support Local Storage, so you won\'t be able to use this webapp.\nTry using a modern web browser.');
}


$(document).ready(function() {
	$('.jumbotron .loading').fadeOut('fast', function() {
		$('#start').fadeIn('slow');
		$('.jumbotron').fadeOut('fast');
	});

	$('#panel-form').disableSelection();


    // Dragging
	$('li', $('#element-list')).draggable({
		containment: 'document',
		cursor: 'move',
		helper: 'clone',
		revert: 'invalid',
		scroll: true
	});

	window.drag = function(draggable, droppableId) {
		var sortIcon = '<i class="glyphicon glyphicon-move"></i>';
		var removeIcon = '<a href="javascript:;" class="remove" data-id="' + droppableId + '" title="Remove this element" onclick="removeElement(this)"><i class="">&times;</i>';
		draggable.clone().prepend(sortIcon).append(removeIcon).appendTo('#' + droppableId);
		$('#' + droppableId).removeClass('free');
		$('#' + droppableId).droppable('disable');
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
		localStorage.removeItem(dataId);
	};

	// Sorting
	$('#panel-form').sortable({
		handle: 'i',
		placeholder: 'sort-placehold'
	});


	// Change properties
	$('.slot').on('click','li a.icon',function() {
		console.log($(this).parent().attr('title'));
		$('a[href="#panel-prop"]').trigger('click');
		var slotId = $(this).parent().parent().attr('id');
		switch($(this).parent().attr('title')){
			case 'button':
//				window.alert(localStorage[slotId]);
				localStorage[slotId] = 'button4';
				$('#current-slot').val(slotId);
				break;
			default:
				localStorage.clear();
				break;
		}
	});







	$('.tabs-left a,.tabs-right a').click(function (event) {
		event.preventDefault();
		$(this).tab('show');
	});
	$('#css').blur(function () {
		$('#saved').slideDown();
		window.setTimeout(function() {
			$('#saved').alert('close');
		}, 5000);
	});
});