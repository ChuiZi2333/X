/******************************************
 * @name 获取京东 COOKIE 同步青龙
 * @channel https://t.me/yqc_123
 * @feedback https://t.me/yqc_777
 * @version 1.0.1
******************************************
# 获取京东 COOKIE 同步青龙

## 脚本注明

    1. 本脚本仅供学习交流，禁止用于商业用途，违者后果自负。
    2. 转载脚本请注明来源，欢迎分享，拒绝倒卖，倒卖🐕必死🐎。
    3. 欢迎对本仓库(https://github.com/Yuheng0101/X)Star✅，但请不要Fork❌。

## 使用方式

> 使用该脚本前务必需要在 👉 [Boxjs](https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/boxjs.json)👈 中配置青龙面板的相关参数。

> 由于该脚本使用 [NobyDa 大佬的京东签到脚本](https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js)获取 CK 的方式进行抓取并同步到青龙面板,所以跟签到脚本不冲突，使用同一组缓存变量。

> Safari 浏览器登录 https://home.m.jd.com/myJd/newhome.action 点击个人中心页面后, 打开app抓包, 提示成功后即可关闭。

## 致谢

[@NobyDa](https://github.com/NobyDa)

[@Peng-YM](https://github.com/Peng-YM)

[@chavyleung](https://github.com/chavyleung)
******************************************

^https:\/\/(api\.m|me-api)\.jd\.com\/api\?functionId=GetJDUserInfoUnionForJD url script-request-header https://raw.githubusercontent.com/Yuheng0101/X/main/Scripts/jdck-ql.js

hostname = me-api.jd.com, api.m.jd.com

******************************************/
const $ = new Env('京东COOKIE同步青龙')
const isRequest = typeof $request !== 'undefined'
$.isNode() && require('dotenv').config()
let QL_HOST = $.isNode() ? process.env.QL_HOST : $.getdata('yuheng_ql_host') || ''
let QL_CLIENT_ID = $.isNode() ? process.env.QL_CLIENT_ID : $.getdata('yuheng_ql_clientid') || ''
let QL_CLIENT_SECRET = $.isNode() ? process.env.QL_CLIENT_SECRET : $.getdata('yuheng_ql_clientsecret') || ''
let isSync = QL_HOST && QL_CLIENT_ID && QL_CLIENT_SECRET
!(async () => {
    isSync && (ql = new QingLong(QL_HOST, QL_CLIENT_ID, QL_CLIENT_SECRET))
    if (isRequest) {
        await GetCookie()
        return
    }
    // ...
})()
    .catch((e) => $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, ''))
    .finally(() => $.done())

// https://github.com/NobyDa/Script/blob/master/JD-DailyBonus/JD_DailyBonus.js#L1582
function checkFormat(value) {
    //check format and delete duplicates
    let n,
        k,
        c = {}
    return value.reduce((t, i) => {
        k = ((i.cookie || '').match(/(pt_key|pt_pin)=.+?;/g) || []).sort()
        if (k.length == 2) {
            if ((n = k[1]) && !c[n]) {
                i.userName = i.userName ? i.userName : decodeURIComponent(n.split(/pt_pin=(.+?);/)[1])
                i.cookie = k.join('')
                if (i.jrBody && !i.jrBody.includes('reqData=')) {
                    console.log(`异常钢镚Body已过滤: ${i.jrBody}`)
                    delete i.jrBody
                }
                c[n] = t.push(i)
            }
        } else {
            console.log(`异常京东Cookie已过滤: ${i.cookie}`)
        }
        return t
    }, [])
}
function CookieUpdate(oldValue, newValue, path = 'cookie') {
    let item,
        type,
        name = (oldValue || newValue || '').split(/pt_pin=(.+?);/)[1]
    let total = $.getdata('CookiesJD')
    try {
        total = checkFormat(JSON.parse(total || '[]'))
    } catch (e) {
        $.msg('京东签到', '', 'Cookie JSON格式不正确, 即将清空\n可前往日志查看该数据内容!')
        console.log(`京东签到Cookie JSON格式异常: ${e.message || e}\n旧数据内容: ${total}`)
        total = []
    }
    for (let i = 0; i < total.length; i++) {
        if (total[i].cookie && new RegExp(`pt_pin=${name};`).test(total[i].cookie)) {
            item = i
            break
        }
    }
    if (newValue && item !== undefined) {
        type = total[item][path] === newValue ? -1 : 2
        total[item][path] = newValue
        item = item + 1
    } else if (newValue && path === 'cookie') {
        total.push({
            cookie: newValue
        })
        type = 1
        item = total.length
    }
    return {
        total: checkFormat(total),
        type, //-1: same, 1: add, 2:update
        item,
        name: decodeURIComponent(name)
    }
}
async function GetCookie() {
    const req = $request
    let Message = ''
    if (req.method != 'OPTIONS' && req.headers) {
        const CV = req.headers['Cookie'] || req.headers['cookie'] || ''
        const ckItems = CV.match(/(pt_key|pt_pin)=.+?;/g)
        if (/^https:\/\/(me-|)api(\.m|)\.jd\.com\/api/.test(req.url)) {
            if (ckItems && ckItems.length == 2) {
                const value = CookieUpdate(null, ckItems.join(''))
                if (value.type !== -1) {
                    const write = $.setdata(JSON.stringify(value.total, null, 2), 'CookiesJD')
                    Message += `${value.type == 2 ? `更新` : `写入`}京东 [账号${value.item}] Cookie${write ? `成功 🎉` : `失败 ‼️`}`
                    await $.msg(`用户名: ${value.name}`, ``, Message)
                } else {
                    console.log(`\n用户名: ${value.name}\n与历史京东 [账号${value.item}] Cookie相同, 跳过写入 ⚠️`)
                }
                if (isSync) {
                    try {
                        const isUpdated = await ql.doUpdate({
                            name: 'JD_COOKIE',
                            value: `${ckItems.join('')}`,
                            remarks: value.name
                        })
                        if (isUpdated) {
                            $.msg(`用户名: ${value.name}`, ``, `同步青龙成功 🎉`)
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
            } else {
                throw new Error('写入Cookie失败, 关键值缺失\n可能原因: 非网页获取 ‼️')
            }
        } else if (req.url === 'http://www.apple.com/') {
            throw new Error('类型错误, 手动运行请选择上下文环境为Cron ⚠️')
        }
    } else if (!req.headers) {
        throw new Error('写入Cookie失败, 请检查匹配URL或配置内脚本类型 ⚠️')
    }
}
// prettier-ignore
function QingLong(e,t,n){const o=(e,t="GET")=>{if($.isNode()&&e.hasOwnProperty("use_proxy")&&e.use_proxy||void 0===e.use_proxy){require("dotenv").config();const t=process.env.PROXY_HOST||"127.0.0.1",n=process.env.PROXY_PORT||7890,o=require("tunnel"),i={https:o.httpsOverHttp({proxy:{host:t,port:1*n}})};Object.assign(e,{agent:i})}return new Promise((n,o)=>{$.http[t.toLowerCase()](e).then(e=>{var t=e.body;try{t=JSON.parse(t)}catch(e){}n(t)}).catch(e=>o(e))})};return new class{constructor(e,t,n){this.host=e?e.endsWith("/")?e:e+"/":"",this.clientId=t,this.clientSecret=n,this.token="",this.envs=[]}async checkLogin(){var e;try{e=JSON.parse($.getdata("yuheng_ql_token")||"{}")}catch(e){return console.log("❌The token is invalid, please re-enter the token"),await this.getAuthToken()}if(Object.keys(e).length){const{token:t,expiration:n}=e,o=(new Date).getTime();o>n?($.log("❌The token has expired"),await this.getAuthToken()):(this.token=t,$.log(`✅The token is successfully obtained (${this.token}) from cache and is valid until ${$.time("yyyy-MM-dd HH:mm:ss",n)}`))}else await this.getAuthToken()}async getAuthToken(){const e={url:`${this.host}open/auth/token`,params:{client_id:this.clientId,client_secret:this.clientSecret}};try{const{code:t,data:n,message:i}=await o(e);if(200!==t)throw i||"Failed to obtain user token.";{const{token:e,token_type:t,expiration:o}=n;$.log(`✅The token is successfully obtained: ${e} and is valid until ${$.time("yyyy-MM-dd HH:mm:ss",1e3*o)}`),this.token=`${t} ${e}`,$.setdata(JSON.stringify({token:this.token,expiration:1e3*o}),"yuheng_ql_token")}}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}async getEnvs(){const e={url:`${this.host}open/envs`,headers:{Authorization:`${this.token}`}};try{const{code:t,data:n,message:i}=await o(e);if(200!==t)throw i||"Failed to obtain the environment variable.";this.envs=n,$.log("✅Obtaining environment variables succeeded.")}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}checkEnv({name:e,remarks:t,value:n}){const o=()=>{const e=n.match(/pin=(.+?);/);if(e){const t=e[1],n=this.envs.findIndex(e=>e.value.includes(`pin=${t};`));return n>-1?($.log(`🆗Pin Matched: ${t}`),n):($.log("⭕No Pin Matched"),-1)}return $.log("⭕No Pin Matchedn"),-1};if("JD_COOKIE"===e||"JD_R_WSCK"===e)return o();const i=this.envs.findIndex(t=>t.name===e);if(-1===i)return-1;if(t){const e=this.envs.findIndex(e=>e.remarks===t);return-1===e?-1:e}}async doUpdate(e){try{await this.checkLogin(),0==this.envs.length&&await this.getEnvs();let t=this.checkEnv(e);if(t>-1){if($.log(`☑️Update the name of the environment variable: ${e.name}`),e.value===this.envs[t].value)return $.log("⚠️The environment variable value is the same, skipped"),!1;await this.updateEnv({...e,_id:this.envs[t]._id});const{value:n}=await this.getEnvById(this.envs[t]._id);return n===e.value||($.log("❌Failed to update the environment variable."),!1)}$.log(`☑️Add the name of the environment variable: ${e.name}`),await this.addEnv([e])}catch(e){return $.log("❌Failed to update the environment variable."),!1}}async addEnv(e){const t={url:`${this.host}open/envs`,headers:{Authorization:`${this.token}`,"Content-Type":"application/json;charset=UTF-8"},body:JSON.stringify(e)};try{const{code:e,message:n}=await o(t,"post");if(200!==e)throw n||"Failed to add the environment variable.";$.log("✅The environment variable was added successfully.")}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}async updateEnv(e){const t={url:`${this.host}open/envs`,method:"put",headers:{Authorization:`${this.token}`,"Content-Type":"application/json;charset=UTF-8"},body:JSON.stringify(e)};try{const{code:n,message:i}=await o(t,"post");if(200!==n)throw i||"Failed to update the environment variable.";$.log("✅The environment variable was updated successfully."),await this.enableEnv([e._id])}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}async deleteEnv(e){const t={url:`${this.host}open/envs`,method:"delete",headers:{Authorization:`${this.token}`,"Content-Type":"application/json;charset=UTF-8"},body:JSON.stringify(e)};try{const{code:e,message:n}=await o(t,"post");if(200!==e)throw n||"Failed to delete the environment variable.";$.log("✅The environment variable was deleted successfully.")}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}async enableEnv(e){const t={url:`${this.host}open/envs/enable`,method:"put",headers:{Authorization:`${this.token}`,"Content-Type":"application/json;charset=UTF-8"},body:JSON.stringify(e)};try{const{code:e,message:n}=await o(t,"post");if(200!==e)throw n||"Failed to enable the environment variable.";$.log("✅The environment variable was enabled successfully.")}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}async getEnvById(e){const t={url:`${this.host}open/envs/${e}`,headers:{Authorization:`${this.token}`}};try{const{code:e,data:n,message:i}=await o(t);if(200===e)return n;throw i||"Failed to get the environment variable."}catch(e){throw e?"object"==typeof e?JSON.stringify(e):e:"Network Error."}}}(e,t,n)}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
