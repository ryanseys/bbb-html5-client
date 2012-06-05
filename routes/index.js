
/*
 * GET home page.
 */

exports.index = function(req, res){
	if(req.session.username) {
		res.redirect('/chat');
	}
	else res.render('index', { title: 'BigBlueButton HTML5 Client' });
};

exports.chat = function(req, res){
	var username = req.body.user.name;
	req.session.username = username;
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: req.session.username });
};

exports.logout = function(req, res){
	req.session.destroy();
	res.redirect('/');
};