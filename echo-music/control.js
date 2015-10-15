var iVan = {
    title : 'iVan\'s echo plug-in/v0.1'
};
//音乐数据
iVan.Data = function(it){
    var data = [];
    var url = 'app-echo.com';
    var $it = it || ( document.getElementById('mainFrame') && $(document.getElementById('mainFrame').contentWindow.document.body).find('.voices-list') ) || $('.voices-list');

    if(location.href.indexOf(url) === -1){
        alert('请跳转至列表页后，开启插件');
        return 0;
    }
    //
    $it.find('li a').each(function(){
        $(this).attr('target','_blank');
    });

    $it.find('li:not(:first)').find('.voice-name a').each(function(){
        data[data.length] = {
            url : this.href,
            title : this.innerHTML
        }
    });
    console.log('iVan.Data->',data);
    return data;
};
//播放器
iVan.Play = (function(){

    var time = 3000;
    var iframe;
    var timer;
    var iframeId = 'musicIframe';
    //iframe 加载完成 开始播放...
    var ready = false;
    //播放完毕回调
    var Callback = $.Callbacks();
    Callback.add(function(){
        console.log('player end!');
        $('.ivan-list').find('.ivan-active').next().find('a').trigger('click');
    });

    //创建标签
    var _createEle = function(tag, opts){
        if(!tag) return;
        var c = opts.mod ? tag : document.createElement(tag);
        for(var k in opts){ c[k] = opts[k] }
        if(opts.onload){
            c.onload = opts.onload.call(this, c);
        }
        return c;
    };
    //收藏
    var fav = (function(){

        var doc;
        var favTips = ['已经收藏过,点击取消!','点击收藏!'];
        //更新收藏状态
        var _check = function(){
            var dom = $('.ivan-fav');
            doc.find('.like-btn').hasClass('active') ? dom.html(favTips[0]).attr('data-fav','1') : dom.html(favTips[1]).attr('data-fav','0');
        };
        var _init = function(opts){
            doc = opts.doc;
            _check();
        };
        var _post = function(){
            var times = 1500, sid, done = false;
            var dom = $('.ivan-fav');
            dom.attr('data-fav') == 1 ? dom.html(favTips[1]).attr('data-fav','0') : dom.html(favTips[0]).attr('data-fav','1');
            var checkIFrame = function(){
                try{
                    if( doc.find('.vjs-current-time-display').length != 0 && doc.find('.vjs-current-time-display').text().substr(-4,5) != '0:00'){
                        doc.find('.like-btn')[0].click();
                        done = true;
                    }
                }catch(e){
                    // sid = setTimeout(function(){checkIFrame();}, times);
                    console.log('ivan likes error->',e);
                }

                !done && (sid = setTimeout(function(){checkIFrame();}, times));
            };
            setTimeout(checkIFrame,times);
        }

        return {
            init : _init,
            post : _post
        }
    })();

    //iframe onload callback
    var iframeReady = function(ifr){
        var times = 1500, sid, done = false;
        var checkIFrame = function(){
            try{
                var doc = $(document.getElementById('mainFrame') ? ifr.contentWindow.document.getElementById('mainFrame').contentWindow.document : ifr.contentWindow.document);
                console.log('Pls Wait...');
                if( doc.find('.vjs-current-time-display').length != 0 && doc.find('.vjs-current-time-display').text().substr(-4,5) != '0:00'){
                    console.log('done->>>',doc.find('.vjs-current-time-display').text());
                    //收藏
                    fav.init({doc:doc});
                    //通知iframe准备完成
                    done = ready = true;
                    clearInterval(timer);
                    //检查播放进度
                    _checkTime(doc);
                    //播放状态
                    _paused.init(doc);

                }else{
                    if( !doc.find('.vjs-play-control').hasClass('vjs-playing')){
                        doc.find('.vjs-play-control').click();
                    }
                }
            }catch(e){
                // sid = setTimeout(function(){checkIFrame();}, times);
                console.log('ivan error->',e);
            }

            !done && (sid = setTimeout(function(){checkIFrame();}, times));
        };
        setTimeout(checkIFrame,times);
    };

    //检测播放进度
    var _checkTime = function(doc){
        timer = setInterval(function(){
            if(ready !== true) return;
            try{
                //检测是否播放完毕
                var n = doc.find('.vjs-current-time-display').find('span').remove('span').end().text().trim().replace(':','');
                var e = doc.find('.voice-length').text().trim().replace(':','');

                if( +n+2 > e ){
                    clearInterval(timer);
                    Callback.fire();
                }
                // if(doc.find('#vjs_video_3').hasClass('vjs-paused')){
                //     clearInterval(timer);
                //     Callback.fire();
                // }

            }catch(e){
                // sid = setTimeout(function(){checkIFrame();}, times);
                console.log('检测播放进度出错->',e);
            }
        },1000);
    };

    //暂停播放
    var _paused = (function(){

        var doc,
            id = '.vjs-play-control',
            tips = ['点击播放','点击暂停']
        ;
        var _ready = function(){
            return doc.find(id).hasClass('vjs-paused') ? 0 : 1;
        };

        var _change = function(){
            console.log('doc->',$('.ivan-play').html());
            $('.ivan-play').html( tips[_ready()] )
        };

        var _call = function(){
            doc.find(id).click();
            _change();
        };

        var _init = function(d){
            if(!d) return;
            doc = d;
            _change();
        };

        return {
            init : _init,
            call : _call
        }
    })();

    //Play
    var _paly = function(url){
        if(!url) return;
        console.log(url);
        iframe = ( iframe ? _createEle(iframe,{
                mod : true,
                src : url,
                onload : iframeReady
            }) :
        _createEle('iframe', {
            id : iframeId,
            src : url,
            width : '0',
            height : '0',
            frameborder : 0,
            onload : iframeReady
        }));
        document.querySelector('body').appendChild(iframe);
    }

    return {
        init : _paly,
        like : fav.post,
        paused : _paused.call
    }

})();

//UI
iVan.Ui = function(){
    var Data = this.data;
    var $contains = $('<div id="iVan-contains" />');
    $contains.css({
        position : 'fixed',
        zIndex : '99999',
        right : '0',
        top : '0',
        height : '100%',
        width : '460px'
    });
    $contains.append('<h5>'+ iVan.title +'</h5>');

    var page = {
        loadData : function(url, data){
            var self = this;
            $.ajax({
                url: url,
                method: "get",
                dataType: "html",
                success : function(doc){
                    console.log('url-data, success!');
                    Data = iVan.data = iVan.Data($(doc).find('.voices-list'));
                    self.list({type :'update'});
                }
            });
        },
        next : function(){
            var cur = $contains.find('.ivan-active');
            if( cur.length === 0 ){ iVan.Log('当前没有正在播放的歌曲!'); return; }
            cur.next().find('a').trigger('click');
        },
        loadCss : function(){
            var fcpCss = 'http://ivan.tunnel.mobi/music/css/style.css';
            $('<link id="_ivan_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
        },
        control : function(){
            var html = [
                '<div class="ivan-mcon">',
                '<p>正在播放：<span class="ivan-playing">-</span></p>',
                // '<a href="#">上一首</a>',
                ' <a href="#" class="ivan-fav">-</a> ',
                // '<del class="ivan-no-click">收藏</del>',
                ' <a href="#" class="ivan-play">-</a> ',
                ' <del class="ivan-no-click">上一首</del> ',
                ' <a href="#" class="ivan-next-m">下一首</a> ',
                '</div>'
            ];

            return html.join('');
        },
        list : function(opts){
            var $ul = opts.type == 'update' ? $contains.find('.ivan-list') : $('<ul class="ivan-list" />');
            var liHtml = [];
            $.each(Data, function(i,it){
                liHtml.push('<li><a class="ivan-mname" href="'+ Data[i].url +'">'+ Data[i].title +'</a></li>')
            });
            $ul.html(liHtml.join(''));
            return $ul;
        },
        pagination : function(){
            var con = $('<div class="ivan-pagination" />');
            var pagina = document.getElementById('mainFrame') ? $(document.getElementById('mainFrame').contentWindow.document).find('.pagination') : $('.pagination');
            var index = pagina.find('li.active').index();
            var li = pagina.find('li:not(.prev,.next) a');
            var html = [];
            li.each(function(i){
                html[html.length] = '<a href="'+ this.href +'" class="'+ ( i == index-1 ? 'ivan-current' : '' ) +'" >'+ this.innerHTML +'</a>';
            });

            con.html( html.join('') );
            return con;
        },
        panels : function(){
            return '<a class="ivan-display ivan-show" style="position:absolute;bottom:0;left:0;padding:5px;z-index:9999;">G</a>'
        },
        init : function(){
            $contains.append(this.control())
                        .append(this.list({type : 1}))
                            .append(this.pagination())
                                .append(this.panels());

            $('body').append($contains);
            this.loadCss();
        }
    };

    //事件绑定
    $contains.on('click', '.ivan-next-m',function(){
    //下一首
        page.next();
    }).on('click', '.ivan-mname', function(){
    //点击播放
        $(this).parent().addClass('ivan-active').siblings().removeClass('ivan-active');
        iVan.Play.init(this.href);
        //更新当前播放名单
        $contains.find('.ivan-playing').html(this.innerHTML);
        return false;
    }).on('click', '.ivan-fav', function(){
    //收藏
        console.log('like');
        iVan.Play.like();
        return false;
    }).on('click', '.ivan-pagination a', function(){
    //分页
        page.loadData(this.href);
        $(this).addClass('ivan-current').siblings().removeClass();
        return false;
    }).on('click', '.ivan-display', function(){
    //显示隐藏
        var _this = $(this);
        var _top = _this.parent().height() - 10;
        if( _this.hasClass('ivan-show') ){
            $contains.animate({
                right : -450
            }).animate({
                top : -_top
            })
        }else{
            $contains.animate({
                top : 0
            }).animate({
                right : 0
            })
        }
        _this.toggleClass('ivan-show');
    }).on('click', '.ivan-play', function(){
    //暂停或播放
        iVan.Play.paused();
        return false;
    });

    page.init();


};
iVan.init = function(){
    this.data = this.Data();
    this.Ui();
}


$(document).ready(function() {
    iVan.init();
    // iVan.Play.init('http://www.app-echo.com/sound/856059');
});