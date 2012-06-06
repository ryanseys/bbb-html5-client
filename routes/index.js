
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', { title: 'BigBlueButton HTML5 Client' });
};

exports.chat = function(req, res){
	req.session.user = req.body.user.name;
	res.cookie('username', req.body.user.name);
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: req.session.user });
};

exports.logout = function(req, res){
	req.session.destroy();
	res.redirect('/');
};