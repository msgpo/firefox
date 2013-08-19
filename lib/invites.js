var data	=	require('sdk/self').data;
var pagemod	=	require('sdk/page-mod');
var config	=	require('config').config;
var simple	=	require('sdk/simple-storage');
var tabs	=	require('sdk/tabs');
var Panel	=	require('sdk/panel');
var request	=	require('sdk/request').Request;
var { on, once, off, emit }	=	require('sdk/event/core');
 
var worker			=	null;
var data_handler	=	null;
var regex			=	new RegExp('https?://'+config.site_url+'/invites/.*/.*/.*');
var port			=	{};

var panel			=	Panel.Panel({
	width: 600,
	height: 224,
	contentUrl: data.url('invites.html')
});

/**
 * Call out to the API to check if an invite exists/is valid. If so, call the
 * success function with the invite data.
 */
var invite_valid	=	function(code, id, success)
{
	request({
		url: config.api_url + '/invites/codes/'+code,
		content: {invite_id: id},
		onComplete: function(result) {
			if(200 <= result.status && result.status < 300)
			{
				success(JSON.parse(result.text));
			}
		}
	}).get();
}

var open	=	function(attach_to)
{
	var invites	=	simple.storage.invites;
	panel.port.emit('update', invites);
	panel.show(attach_to);
};

var process_invite	=	function(code, id, key)
{
	// TODO: request invite against server. if valid, store it, open invites
	// dialog (with ALL stored invites). if invalid, ignore it and do nothing
	invite_valid(code, id, function(invite) {
		// add in the key
		invite.key	=	key;

		// add the invite to persistent storage
		if(!simple.storage.invites) simple.storage.invites = {};
		simple.storage.invites[invite.id]	=	invite;

		console.log('invite valid: ', invite.code, invite.key);

		// if user is logged in, open the invites panel
		if(data_handler.get('auth', false))
		{
			// user is logged in. show invites dialog
			emit(port, 'invite_open');
		}
	});
};

var have_pending	=	function()
{
	return Object.keys(simple.storage.invites || {}).length > 0;
};

var init	=	function(datahandler)
{
	if(worker) return worker;

	// are you a hip replacement VICTIM???? you may be ENTITLED to money!!!!1
	data_handler	=	datahandler;

	// give it a path with some invite data and this splits out the correct
	// values. helper function.
	var process_invite_path	=	function(path)
	{
		var code		=	path.replace(/.*\/invites\/([0-9a-f-]+)\/.*$/, '$1');
		var invite_id	=	path.replace(/.*\/invites\/[0-9a-f-]+\/([0-9a-f-]+)\/.*$/, '$1');
		var key			=	path.replace(/.*\/invites\/[0-9a-f-]+\/[0-9a-f-]+\/([0-9a-f-]+).*?$/, '$1');
		console.log('code: ', code);
		console.log('id: ', invite_id);
		console.log('key: ', key);
		if(	code.match(/^[0-9a-f-]+$/) &&
			invite_id.match(/^[0-9a-f-]+$/) &&
			key.match(/^[0-9a-f-]+$/) )
		{
			process_invite(code, invite_id, key);
		}
	};

	// here we look for any tabs opening that match our invite processing page
	// URL
	worker	=	pagemod.PageMod({
		include: regex,
		contentScript: 'self.port.emit("path", window.location.pathname);',
		onAttach: function(worker) {
			worker.port.on('path', function(path) {
				process_invite_path(path);
			});
		}
	});

	// note only do we look for invites on new tabs, but also loop over all
	// current tabs and find any matching (existing) tabs. this allows a user
	// to install the addon from an invite page and have the addon track the
	// invite instantly.
	for(var i = 0, n = tabs.length; i < n; i++)
	{
		var tab	=	tabs[i];
		var url	=	tab.url;
		if(!regex.exec(url)) continue;

		var path		=	url.replace(/^[a-z]+:\/\/[^\/]+/, '');
		process_invite_path(path);
	}
	return worker;
};

var destroy	=	function()
{
	if(!worker) return false;
	off(port);
	worker.destroy();
	worker	=	null;
};

exports.have_pending	=	have_pending;
exports.init			=	init;
exports.open			=	open;
exports.port			=	port;
exports.destroy			=	destroy;
