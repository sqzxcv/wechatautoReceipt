require('babel-register')
// const qrcode = require('qrcode-terminal')
const fs = require('fs')
// const request = require('request')
const parseString = require('xml2js').parseString
const Wechat = require('wechat4u')
const communication = require('./communication')
var mysql = require('mysql')
var config = require('../config');
var randomString = require('../common/common').randomString;
var moment = require('moment');
var wxbot = null;

module.exports = function (bot) {

    wxbot = bot;
    /**
     * 如何处理会话消息
    */

    bot.on('message', msg => {
        /**
         * 获取消息时间
         */
        console.log(`----------${msg.getDisplayTime()}-----${bot.contacts[msg.FromUserName].getDisplayName()}-----`)
        /**
         * 判断消息类型
         */
        switch (msg.MsgType) {
            case bot.CONF.MSGTYPE_TEXT:
                /**
                 * 文本消息
                 */
                console.log(msg.Content);
                // bot.sendMsg("test", msg.FromUserName);
                sendCommunicationMsg(bot, msg);
                break
            case bot.CONF.MSGTYPE_IMAGE:
                /**
                 * 图片消息
                 */
                console.log('图片消息，保存到本地')
                bot.getMsgImg(msg.MsgId).then(res => {
                    fs.writeFileSync(`./media/${msg.MsgId}.jpg`, res.data)
                }).catch(err => {
                    bot.emit('error', err)
                })
                sendCommunicationMsg(bot, msg);
                break
            case bot.CONF.MSGTYPE_VOICE:
                /**
                 * 语音消息
                 */
                console.log('语音消息，保存到本地')
                bot.getVoice(msg.MsgId).then(res => {
                    fs.writeFileSync(`./media/${msg.MsgId}.mp3`, res.data)
                }).catch(err => {
                    bot.emit('error', err)
                })
                sendCommunicationMsg(bot, msg);
                break
            case bot.CONF.MSGTYPE_EMOTICON:
                /**
                 * 表情消息
                 */
                console.log('表情消息，保存到本地')
                bot.getMsgImg(msg.MsgId).then(res => {
                    fs.writeFileSync(`./media/${msg.MsgId}.gif`, res.data)
                }).catch(err => {
                    bot.emit('error', err)
                })
                sendCommunicationMsg(bot, msg);
                break
            case bot.CONF.MSGTYPE_VIDEO:
            case bot.CONF.MSGTYPE_MICROVIDEO:
                /**
                 * 视频消息
                 */
                console.log('视频消息，保存到本地')
                bot.getVideo(msg.MsgId).then(res => {
                    fs.writeFileSync(`./media/${msg.MsgId}.mp4`, res.data)
                }).catch(err => {
                    bot.emit('error', err)
                })
                sendCommunicationMsg(bot, msg);
                break
            case bot.CONF.MSGTYPE_APP:
                if (msg.AppMsgType == 6) {
                    /**
                     * 文件消息
                     */
                    console.log('文件消息，保存到本地')
                    bot.getDoc(msg.FromUserName, msg.MediaId, msg.FileName).then(res => {
                        fs.writeFileSync(`./media/${msg.FileName}`, res.data)
                        console.log(res.type);
                    }).catch(err => {
                        bot.emit('error', err)
                    })
                    sendCommunicationMsg(bot, msg);
                }
                break
            default:
                break
        }
    })
    /**
     * 如何处理红包消息
     */
    bot.on('message', msg => {
        if (msg.MsgType == bot.CONF.MSGTYPE_SYS && /红包/.test(msg.Content)) {
            // 若系统消息中带有‘红包’，则认为是红包消息
            // wechat4u并不能自动收红包
        }
    })
    /**
     * 如何处理转账消息
     */
    bot.on('message', msg => {
        if (msg.isSendBySelf == false && msg.MsgType == bot.CONF.MSGTYPE_APP && msg.AppMsgType == bot.CONF.APPMSGTYPE_TRANSFERS) {
            // 转账
            dealTransfer(bot, msg);
        }
    })
    /**
     * 如何处理撤回消息
     */
    bot.on('message', msg => {
        if (msg.MsgType == bot.CONF.MSGTYPE_RECALLED) {
            // msg.Content是一个xml，关键信息是MsgId
            let MsgId = msg.Content.match(/<msgid>(.*?)<\/msgid>.*?<replacemsg><!\[CDATA\[(.*?)\]\]><\/replacemsg>/)[0]
            // 得到MsgId后，根据MsgId，从收到过的消息中查找被撤回的消息
        }
    })
    /**
     * 如何处理好友请求消息
     */
    bot.on('message', msg => {
        if (msg.MsgType == bot.CONF.MSGTYPE_VERIFYMSG) {
            bot.verifyUser(msg.RecommendInfo.UserName, msg.RecommendInfo.Ticket)
                .then(res => {
                    console.log(`通过了 ${bot.Contact.getDisplayName(msg.RecommendInfo)} 好友请求`)
                    bot.sendMsg(`欢迎${bot.Contact.getDisplayName(msg.RecommendInfo)}加入爱吧,很高兴认识您,我是机器人雯雯,以后您有任何问题都可以联系我哟`, msg.FromUserName);
                    var msgStr = `雯雯:现有爱吧各 VIP 套餐如下:年卡(365天)--258元,包月卡(30天)--58元,在您转账成功后账号将会发给您,比如:您转账58元,稍后将会自动为您创建或者充值 VIP 包月套餐账户`;
                    bot.sendMsg(msgStr, msg.FromUserName);
                    bot.sendMsg(`雯雯保证账户长期有效,如果您有些疑虑,也可以先用体验卡,公司先推出7天VIP 体验卡,只需19.9元哟,一顿饭,一包烟的钱可以免费体验7天`, msg.FromUserName);
                })
                .catch(err => {
                    bot.emit('error', err)
                })
        }
    })
    /**
     * 如何直接转发消息
     */
    // bot.on('message', msg => {
    //   // 不是所有消息都可以直接转发
    //   bot.forwardMsg(msg, 'filehelper')
    //     .catch(err => {
    //       bot.emit('error', err)
    //     })
    // })
    /**
     * 如何获取联系人头像
     */
    // bot.on('message', msg => {
    //     bot.getHeadImg(bot.contacts[msg.FromUserName].HeadImgUrl).then(res => {
    //         fs.writeFileSync(`./media/${msg.FromUserName}.jpg`, res.data)
    //     }).catch(err => {
    //         bot.emit('error', err)
    //     })
    // })
}


function sendCommunicationMsg(bot, msg) {

    if (msg.isSendBySelf == true) {
        return;
    }
    var pool = mysql.createPool({
        host: config['dbhost'],
        user: config['dbuser'],
        password: config['dbpwd'],
        database: "BB",
        connectionLimit: 100,
        port: "3306",
        waitForConnections: false
    });

    var df = moment();
    pool.getConnection(function (err, connection) {

        if (!err) {
            connection.query("insert into wxmsg(content,fromusername,createtime,MsgType) values(?,?,?,?)", [msg.Content, msg.FromUserName, parseInt(msg.CreateTime), parseInt(msg.MsgType)], function (err, results, fields) {

                connection.release();
                if (err) {
                    console.error(err);
                }
                bot.sendMsg(`欢迎${bot.contacts[msg.FromUserName].getDisplayName()}回来,雯雯在这里等你好久咯`, msg.FromUserName);
                var msgStr = `雯雯:现有爱吧各 VIP 套餐如下:年卡(365天)--258元,包月卡(30天)--58元,在您转账成功后账号将会发给您,比如:您转账58元,稍后将会自动为您创建或者充值 VIP 包月套餐账户`;
                bot.sendMsg(msgStr, msg.FromUserName);
                bot.sendMsg(`雯雯保证账户长期有效,如果您有些疑虑,也可以先用体验卡,公司先推出7天VIP 体验卡,只需19.9元哟,一顿饭,一包烟的钱可以免费体验7天`, msg.FromUserName);
            });
        } else {
            console.error(err);
        }
    });
}

function dealTransfer(bot, msg) {

    parseString(msg.Content, function (err, result) {
        console.dir(JSON.stringify(result));
        //转账金额 result.msg.appmsg[0].wcpayinfo[0].feedesc[0] = "￥0.10"
        //转账单号:result.msg.appmsg[0].wcpayinfo[0].transferid[0] = ""
        var transferid = result.msg.appmsg[0].wcpayinfo[0].transferid[0];
        var transferamount = parseFloat(result.msg.appmsg[0].wcpayinfo[0].feedesc[0].replace(/￥/g, ""));
        var des = result.msg.appmsg[0].des[0];

        notifySupportWithInfo(des);
        console.log(`********转账记录*******已经收到用户转账.转账信息如下:\n微信昵称:${bot.contacts[msg.FromUserName].getDisplayName()}\n转账时间:${msg.getDisplayTime()}\n 转账金额:${transferamount}\n转账详细信息如下:\n${JSON.stringify(result)}`)

        var pool = mysql.createPool({
            host: config['dbhost'],
            user: config['dbuser'],
            password: config['dbpwd'],
            database: "BB",
            connectionLimit: 100,
            port: "3306",
            waitForConnections: false
        });

        pool.getConnection(function (err, connection) {

            if (!err) {
                connection.query("select * from wxtranscation where transferid=?", [transferid], function (err, results, fields) {

                    if (err) {

                        bot.sendMsg("正在忙,请稍后...", msg.FromUserName);
                        notifySupportWithInfo(`[紧急]查询转账记录是否存在-失败,详细信息:{${des}}.  transferid=${transferid}`)
                        return;
                    }
                    if (results.length != 0) {
                        console.log("同一个转账记录用户重复发送了")
                        bot.sendMsg("正在处理,请稍后...", msg.FromUserName);
                        return;
                    } else {
                        //新的转账记录,为用户创建账户,或者充值.
                        connection.query("insert into wxtranscation(transferid,fromusername,createtime,transferamount) values(?,?,?,?)", [transferid, msg.FromUserName, parseInt(msg.CreateTime), transferamount], function (err, results, fields) {
                            if (err) {
                                console.error(err);
                                console.warn(`********wxtranscation*******已经收到用户转账,但是转账记录存入数据库时失败.转账信息如下:\n微信昵称:${bot.contacts[msg.FromUserName].getDisplayName()}\n转账时间:${msg.getDisplayTime()}\n 转账金额:${transferamount}\n转账详细信息如下:\n${JSON.stringify(result)}`)

                            }
                        });

                        //查询该微信用户是否已经绑定用户,如果绑定更新账户信息,否则新建用户
                        connection.query("select * from user where wxusername=?", [msg.FromUserName], function (err, results, fields) {

                            if (err) {
                                console.error(err);
                                bot.sendMsg("正在忙,请稍后", msg.FromUserName);
                                notifySupportWithInfo(`[紧急]查询该微信用户是否已经绑定账户-失败,详细信息:{${des}}.  transferid=${transferid}`)
                                return;
                            }
                            var duration = 0;
                            if (transferamount < 19.9) {

                                bot.sendMsg("您支付的净额不够,请重新支付,至少支付19.9元", msg.FromUserName)
                                return;
                            } else if (transferamount >= 19.9 && transferamount < 58) {
                                duration = 7;
                            } else if (transferamount >= 58 && transferamount < 258) {
                                duration = 30;
                            } else if (transferamount >= 258) {
                                duration = 365;
                            }
                            if (results.length != 0) {

                                var expirestime = moment.unix(results[0]['expirestime']).add(duration, "days").unix();
                                connection.query("update user set expirestime=? where uid=?", [expirestime, results[0]['uid']], function (err, updateResults, fields) {

                                    bot.sendMsg(`充值成功`, msg.FromUserName);
                                    bot.sendMsg(`您当前账户:${results[0]['username']},到期时间:${moment.unix(results[0]['expirestime']).format('YYYY-M-D')}.如果在使用过程中有任何问题,随时联系我们.`, msg.FromUserName)
                                });

                            } else {

                                genUsername(6, function (username) {

                                    var pwd = randomString(6);
                                    var expirestime = moment().add(duration, "days").unix();
                                    connection.query("insert into user(username,pwd,expirestime,wxusername,wxnickname) values(?,?,?,?,?)", [username, pwd, expirestime, msg.FromUserName, bot.contacts[msg.FromUserName].getDisplayName()], function (err, results, fields) {

                                        connection.release();
                                        if (err == null) {

                                            bot.sendMsg(`账户创建成功`, msg.FromUserName);
                                            bot.sendMsg(`您当前账户:${username},密码:${pwd},到期时间:${moment.unix(expirestime).format('YYYY-M-D')}.如果在使用过程中有任何问题,随时联系我们.`, msg.FromUserName)
                                        } else {
                                            bot.sendMsg("正在忙,请稍后", msg.FromUserName);
                                            notifySupportWithInfo(`[紧急]创建账户-失败,详细信息:{${des}}.  transferid=${transferid}`)
                                        }
                                    });
                                });
                            }
                        });
                        //创建新用户
                        function genUsername(len, usernameCallback) {

                            username = randomString(len);
                            //查询是否存在同名 user
                            connection.query("select * from user where username=?", [username], function (err, results, fields) {

                                if (err) {
                                    console.error(err);
                                    bot.sendMsg("正在忙,请稍后", msg.FromUserName);
                                    notifySupportWithInfo(`[紧急]创建账户-失败,详细信息:{${des}}.  transferid=${transferid}`)

                                    return;
                                }
                                if (results.length != 0) {

                                    genUsername(len++, usernameCallback);
                                } else {
                                    usernameCallback(username);
                                }
                            });
                        }
                    }
                });
            } else {
                console.error(err);
                console.warn(`********wxtranscation*******已经收到用户转账,但是转账记录存入数据库时失败.转账信息如下:\n微信昵称:${bot.contacts[msg.FromUserName].getDisplayName()}\n转账时间:${msg.getDisplayTime()}\n 转账金额:${transferamount}\n转账详细信息如下:\n${JSON.stringify(result)}`)
                bot.sendMsg("正在忙,请稍后", msg.FromUserName);
                notifySupportWithInfo(`[紧急]获取数据库链接-失败,详细信息:{${des}}.  transferid=${transferid}`)

            }
        });
    });
}

function notifySupportWithInfo(msg) {

    wxbot.sendMsg(msg, "@e5588d1d843d690a496dcb16809f7b6d");
}