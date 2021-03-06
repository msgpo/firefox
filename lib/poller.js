/**
 * The poller creates an interface for adding/removing functions from being run
 * periodically. This is more for maintenance tasks than anything else, as the
 * timestep it uses is fixed at a lowish value (ie 100ms).
 *
 * If you want to set up a timer that runs a function, say, every 10 seconds
 * then this must be done manually. The poller library exposes a function,
 * poll_timer, just for this purpose: a timer that can be started, stopped,
 * restarted, and takes an action to run when the timer finishes counting down.
 */

var timer		=	require('timer');

// determines if the poller is enabled or not. meant to be set by set_enable_cb
var enable_cb	=	function() { return false; };
var functions	=	[];

var set_enable_cb	=	function(cb)
{
	enable_cb	=	cb;
	return true;
};

var add_poller	=	function(fn)
{
	functions.push(fn);
};

var remove_poller	=	function(fn)
{
	var idx		=	functions.indexOf(fn);
	if(idx == -1) return;
	var fns		=	functions.slice(0, idx).concat(functions.slice(idx + 1));
	functions	=	fns
};

var clear_pollers	=	function()
{
	functions	=	[];
};

var poll	=	function(delay)
{
	if(!enable_cb()) return false;
	for(var i = 0, n = functions.length; i < n; i++)
	{
		var fn	=	functions[i];
		fn();
	}
	timer.setTimeout(function() { poll(delay); }, delay);
};

/**
 * Define a timer that calls a specified function after a given amount of time.
 * The timer can be reset/stopped after being started.
 */
var poll_timer	=	function(ms, fn, options)
{
	options || (options = {});
	var poll		=	options.poll || 50;
	var start_ms	=	0;
	var is_started	=	false;

	var stop	=	function()
	{
		start_ms	=	0;
		is_started	=	false;
	};

	var run		=	function()
	{
		if(!is_started) return;
		var t	=	new Date().getTime();

		if(t - start_ms >= ms)
		{
			stop();
			fn();
		}
		else
		{
			timer.setTimeout(run, poll);
		}
	};

	var start	=	function()
	{
		start_ms	=	new Date().getTime();
		is_started	=	true;

		timer.setTimeout(run, poll);
	};

	var reset	=	function()
	{
		if(!is_started) return start();
		start_ms	=	new Date().getTime();
	}

	// return our closures
	return {
		start: start,
		stop: stop,
		reset: reset
	};
};

exports.set_enable_cb	=	set_enable_cb;
exports.add_poller		=	add_poller;
exports.remove_poller	=	remove_poller;
exports.clear_pollers	=	clear_pollers;
exports.poll			=	poll;
exports.timer			=	poll_timer;

