
module.exports = {
    randomString: randomString,
    inviteLink : inviteLink
};

function randomString(len) {
    len = len || 32;
    var $chars = 'abcdefhijkmnprstwxyz';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

function inviteLink(req, res) {

    if (req.cookies.invite_code == undefined) {
        var invite_code = randomString(15);
        var invitLink = "主播全裸视频:http://love8video.com/inviteby/" + invite_code;
        res.cookie('invite_code', invite_code, { maxAge: 10 * 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: '/', secure: false });
        return invitLink;
    } else {
        
        return "主播全裸视频:http://love8video.com/inviteby/" + req.cookies.invite_code;
    }

}