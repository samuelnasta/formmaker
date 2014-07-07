'use strict';
// Check if user has a browser that supports Local Storage
var Modernizr;
if (!Modernizr.localstorage) {
	window.alert('Your browser doesn\'t support Local Storage, so you won\'t be able to use this webapp.\nTry using a modern web browser.');
}


$(document).ready(function() {
	window.sortIcon = '<i class="glyphicon glyphicon-move"></i>';
	window.tempCSS = null;

	$('.jumbotron .loading').fadeOut('fast', function() {
		$('#start').fadeIn('slow');
		window.start();
	});

	window.start = function() {
		$.getScript('http://formmaker:8888/functions.php?menu').done(function(data) { return data; });
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
			window.tempArray = [];

			for(var i = 0; i < dataArray.length; i++) {
				window.tempArray.push(localStorage.getItem(dataArray[i]));
			}
			// Removes empty elements
			window.tempArray = window.tempArray.filter(function(e) { return e; });

			// Remembers the CSS saved
			if(localStorage.getItem('css')) { window.tempCSS = localStorage.getItem('css'); }

			localStorage.clear();

			if(window.tempCSS) {
				$('#css').html(window.tempCSS);
				localStorage.css = window.tempCSS;
			}

			// Returns the final object with optimized sorting
			var finalObj = {};
			var tempOrder = [];
			for(var j = 0; j < window.tempArray.length; j++) {
				var key = 'slot-' + (j+1);
				finalObj[key] = window.tempArray[j];
				tempOrder.push(key);
			}
			localStorage.order = tempOrder.join();


			// Resets the localStorage and fills the elements panel
			$.each(finalObj,function(key, value){
				localStorage[key] = value;
				var temp = value.split('"');
				var type = temp[3];
				var wrapper = '<li title="' + type + '">';
				var removeIcon = '<a href="javascript:;" class="remove" data-id="' + key + '" title="Remove this element" onclick="removeElement(this)"><i>&times;</i></a>';
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
		var removeIcon = '<a href="javascript:;" class="remove" data-id="' + droppableId + '" title="Remove this element" onclick="removeElement(this)"><i>&times;</i></a>';
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
		$(element).parent().fadeOut(300, function() { $(this).remove(); });
		var dataId = $(element).attr('data-id');
		$('#' + dataId).droppable('enable');
		$('.slot').removeClass('sort-placehold');
		localStorage.removeItem(dataId);
		window.list();
	};


	// Refresh the list order
	window.list = function() {
		var listArray = [];
		$('#slot-container div').each(function() { listArray.push($(this).attr('id')); });
		localStorage.order = listArray;
	};


	// Sorting
	$('#slot-container').sortable({
		handle: 'i',
		placeholder: 'sort-placehold',
		stop: function() { window.list(); }
	});



	// Add new slot
	window.addSlot = function() {
		var slotNumber = $('#slot-container div').last().attr('id').split('slot-');
		slotNumber = parseInt(slotNumber[1]);
		slotNumber++;
		
		$('#slot-container').append('<div id="slot-' + slotNumber + '" class="slot free" data-toggle="tooltip" data-placement="right" title="#slot-' + slotNumber + '"><span></span></div>').children(':last').hide().fadeIn(500);
		$('#slot-' + slotNumber).droppable({
			accept: '#element-list > li',
			activeClass: 'dragging',
			drop: function(event, ui) {
				var droppableId = $(this).attr('id');
				window.drag(ui.draggable, droppableId);
			}
		});
		$(document.body).scrollTop($('#slot-' + slotNumber).offset().top);
	};



	// Change properties
	$('#slot-container').on('click','.slot li a.icon',function() {
		var slotId = $(this).parent().parent().attr('id');
		var title = $(this).parent().attr('title');

		$('a[href="#panel-prop"]').trigger('click');
		$('.slot').removeClass('sort-placehold');
		$(this).parent().parent().addClass('sort-placehold');
		$('#panel-prop form').removeClass('active');
		$('#form-prop-' + title).addClass('active');
		$('#current-slot').val(slotId);
		window.fillForm(slotId);
	});



	// Get the value from Local Storage and fill the properties panel
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



	// Preview the form
	$('#menu-preview').on('click',function() {
		var JSONArray = JSON.stringify(window.tempArray);
		window.load();
		$.post('http://formmaker:8888/functions.php?preview', {
			'form': JSONArray,
			'css' : $('#css').val()
		}).done(function(data) {
		    var preview = window.open('about:blank');
			preview.document.open();
			preview.document.write(data);
			preview.document.close();
		}).fail(function() {
			window.alert('Ops! Error found! Sorry about that.');
		});
	});



	// Edit CSS panel
	$('a[href=#panel-css]').on('click',function() {
		$('#slot-container .slot').tooltip('show');
		window.setTimeout(function() { $('#slot-container .slot').tooltip('hide'); }, 5000);
		$('#css').focus().select();
	});



	// Saves form to database
	window.save = function() {
		window.load();
		var JSONArray = JSON.stringify(window.tempArray);

		$.post('http://formmaker:8888/functions.php?save', {
			'form': JSONArray,
			'css': $('#css').val()
		}).done(function() {
			$('#saved').slideDown();
			window.setTimeout(function() {
				$('#saved').slideUp();
			}, 5000);
		}).fail(function() {
			window.alert('Ops! Error found! Sorry about that.');
		});
	};



	// Login
	$('#submit-login').on('click',function() {
		$('#modal-login').modal('hide');

		$.post('http://formmaker:8888/functions.php?login', {
			'login-email': $('#login-email').val(),
			'login-password': $('#login-password').val()
		}, function(data) {
			if(parseInt(data) === 1) {
				$('#logged').slideDown();
				window.setTimeout(function() {
					$('#logged').slideUp();
				}, 5000);
				$('#menu-login').hide();
				$('#logged-menu').show();
				$('#menu-save').attr('disabled', false);
			} else {
				window.alert('Login incorrect. Please verify and try again.');
			}
		}).fail(function() {
			window.alert('Ops! Error found! Sorry about that.');
		});
	});



	// Load list of links of saved forms
	$('#load-list').on('click','a',function() {
		$('#modal-load').modal('hide');


		$.getScript('http://formmaker:8888/functions.php?load=' + $(this).attr('data-id'))
			.done(function(data) {
				return data;
			})
			.fail(function() {
				window.alert('Ops! Error found! Sorry about that.');
			});
	});



	// Load list of links of saved forms
	$('#menu-load').on('click',function() {
		$('#modal-load').modal('show');

		$.post('http://formmaker:8888/functions.php?loadlist'
			).done(function(data) {
				$('#load-list').html(data);
			}).fail(function() {
				window.alert('Ops! Error found! Sorry about that.');
			});
	});



	// New form
	$('#menu-new').on('click',function() {
		localStorage.clear();
		document.location.href = 'http://formmaker:8888/functions.php?newform';
	});



	// Logout
	$('#menu-logout').on('click',function() {
		$.post('http://formmaker:8888/functions.php?logout', function() {
			$('#menu-login').show();
			$('#logged-menu').hide();
			$('#menu-save').attr('disabled', true);
		}).fail(function() {
			window.alert('Ops! Error found! Sorry about that.');
		});
	});



	// Sign up
	$('#submit-signup').on('click',function() {
		if($('#signup-password').val() === $('#signup-confirm').val()) {

			$('#modal-signup').modal('hide');

			$.post('http://formmaker:8888/functions.php?signup', {
				'signup-email': $('#signup-email').val(),
				'signup-password': $('#signup-password').val()
			}).done(function() {
				window.alert('Signup created');
			}).fail(function() {
				window.alert('Ops! Error found! Sorry about that.');
			});
		} else {
			window.alert('The passwords doesn\'t match.');
		}
	});



	// Shortcut to press enter
	$(document).keyup(function(event) {
		var ESC_KEYCODE = 27;
		if(event.keyCode === ESC_KEYCODE) {
			$('#modal-login').modal('hide');
			$('#modal-signup').modal('hide');
		}
	});



});