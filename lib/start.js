/**
 * A library for showing a "New user??!?!?!?! START HERE!" panel
 */

var data	=	require('sdk/self').data;
var Panel	=	require('sdk/panel');
var timer	=	require('timer');

var open	=	function(attach_to)
{
	var panel	=	Panel.Panel({
		width: 250,
		height: 75,
		contentURL: data.url('start.html')
	});
	panel.show(attach_to);

	// NEVER. AGAIN.
	panel.on('hide', function() {
		panel.destroy();
		panel	=	false;
	});

	timer.setTimeout(function() { panel && panel.hide(); }, 5000);
};

exports.open	=	open;