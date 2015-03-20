/**
SCROLL LOADER!
When load is called a timeout is set to call scroll_loader.init

When init is called:
    Check the height of the article to see if we should even do anything.
    If it's high enough:
        call ad_box_draw
    if FB is defined:
        Subscribe to "xfbml.render" to populate extra boxes

    In ad_box_draw:
        Call ad_loader to place an ad
        Call a_wire_loader to place the content from the "A Wire" section
        Call scaffold_loader
    In ad_loader:
        create a wrapper div
            place it below the existing sidebar content
        Initilaize the ad by calling init_ads
    In a_wire_loader:
        grab the ad_box_wrapper div
        Create a div
        Create an H3
        create a ul
        Add article-type to the ul
        make the div's id "a_wire"
        make the ul's id 'a_wire_wrapper'
        append the ul to the div then attach it to the ad_box wrapper
        call get_data
        call ajax_call with data and the ul
    In scaffold_loader:
        calculate the available height of the sidebar
        while the available height is less than the size of the combined ad + stroies:
            call ad_loader
            call shell_loader
            update wrapper heights
    In shell_loader:
        create a shell div and place it on the page under the last ad_aox_wrapper
        call article_loader with the newly created div
    In article_loader:
        create a div
            give it a class of "more_from_ut"
        create an h3
            give it the text of ("Recent" + r_app.section_name)
        create a ul
            Giveit the class of "link_wrapper"
        append the title to the div
        append the ul to the div
        append the div to our passed in element
        call get_data
        call ajax_call with a url, data and the ul
    In get_data:
        populate ajax options and return them
    in ajax_call:
        do an ajax request for the url
        in ajax:success:
            call callback_reciever with the json and element passed in
        in ajax:error:
            log the error
        in ajax:complete:
            log a message
    in callback_reciever:
        if the json is valid (more than one item):
            for each element in the json:
                call render_item with the json.items[index]'s data and the element passed in.
    in render_item:
        create an li
        check to see if there is a start date and bail out early if found (the first element will contain just a start time)
        if there is a lead photo:
            set the lead_photo to be a div and an image
        otherwise:
            set lead_photo to blank and h3_clas to the proper class
        append the li to the passed in element
        set li's innerHTML to the response from calling create_html with the edited item returned from the api
    In create_html:
        return a link with all the required properties


**/
var r_app = window.r_app || {};

r_app.scroll_loader = function() {
    /***
    * Initialize function when DOM-ready.
    */
    $(window).load(function() {
        // call the init function eventually
        window.setTimeout(init, 30);
    });
    var article_cache = {},
        articles_per_box = 3,
        last_index = 0;

    function init(){
        r_app._article_height = $("article").height();
        var content_height = $("article" ).outerHeight(true),
            rendered_sidebar = $("#sidebar").outerHeight(true),
            real_wrap_height = $("article" ).height() - $("#sidebar").height();

        console.log( "Ad box test is ready." );
        /***
         * If space below sidebar is > 955px then work needs to be done.
         */
        if ( content_height - rendered_sidebar > 955 ){
            // draw the ad box
            ad_box_draw();
            // window.addEventListener('scroll', recalc);
            // window.setTimeout(recalc, 1);
            // $("article").bind('resize', recalc);
            try {
                // if facebook comments are enabled on this page
                if (FB != undefined) {
                    // listen for the render callback
                    FB.Event.subscribe("xfbml.render", recalc);
                }
            } catch(err) {
                console.log(err);
            }
        }
    }
    // no clue
    var total_box_height = $("[class^=boxy").outerHeight(true);

    /**
    recaculate the hights and initiate the loading of the additional stuff
    */
    function recalc(){
        console.log('Recalculating height');
        var articleHeight = $('article').height(),
            winHeight = window.innerHeight ? window.innerHeight : $window.height(),
            scrollDistance = $window.scrollTop() + winHeight,
            // our element we created
            element = $('.ad_box_wrapper'),
            // the hight of the article
            article = $("article" );
        // set the element we created to the height of the article.
        element.outerHeight(article.outerHeight(true));
        // load the scaffolding
        scaffold_loader();
        // load the additional articles
        article_loader();
    }
    /**
    helper function, makes sure that ad support is there before re-initialization

    @param {element} jQuery element(s) to work on
    */
    function init_ads(element){
        if (app.adsLazy !== undefined){
            app.adsLazy.init(element);
        }
    }
    /**
        draw an ad box, this ad is a big box ad.
        TODO: Specify where the box should be drawn
    */
    function  ad_box_draw() {
        console.log( "Ad box is drawing." );

        var right_side = document.getElementById("sidebar");
            real_wrap_height = $("article" ).height() - $("#sidebar").height(),
            para = document.createElement("div"),
            // create the ad_box_wrapper element
            element = $('<div id="ad_box_wrapper" class="column alpha omega"></div>');
        // push it into the dom
        element.appendTo("#sidebar");

        // set the ad_box_warpper's hight to the difference of sidebar and article
        // element.height($("article").height() - $("#sidebar").height());

        // load the add
        ad_loader();
        // load the a_wire stories
        // TODO: why is this here? They should already be loaded.
        app.sectionLimit = 3;
        a_wire_loader();

        console.log('Ad automatically inserted.');
        console.log('Article inserted.');

        // load up the scaffolding
        scaffold_loader();
        // $('article').trigger($.Event('resize'));
    }

    var scaffold_count = 0;
    /**
    create the appropiate amount of adds and boxes
    this function may be called many times.
    Ensure that on each call only an appropiate amount of ads and article shells are created
    Visual representation assuming that each bar (|) is the height of an ad position (240px)
    |      ARTICLE    | SIDEBAR |
    |-----------------|---------|
    |                 |   AD    |
    |                 | Content |
    |       STORY     | Content |
    |                 | Content |
    |-----------------|---------|

    if the story content is bigger than the calculated height of the sidebar:
        Generate:
            an AD position
            section content
        As long as we have room.
    */
    function scaffold_loader() {
        var real_wrap_height = $("article").height() - $("#sidebar").height(),
            scroller = $(window).scrollTop() + $(window).height() - $("#ad_box_wrapper").offset().top,
            ad_height = 250, //$("[class^=boxy]").outerHeight(true);
            ad_number = $("[class^=boxy]").length,
            art_height = 750, //$("[class^=article_shell]").outerHeight(true);
            art_number = $("[class^=article_shell]").length,
            total_box_height = (ad_height * ad_number) + (art_height * art_number);

      app.sectionLimit = 3;
      while( total_box_height < real_wrap_height ){

          ad_loader();
          shell_loader();

          real_wrap_height = $("#content > div > div > article" ).height() - $("#sidebar").height();
          ad_number = $("[class^=boxy]").length;
          art_number = $("[class^=article_shell]").length;
          total_box_height = (ad_height * ad_number) + (art_height * art_number);

          console.log("wrap"+real_wrap_height);
          console.log("content"+total_box_height);
      }

      scaffold_count++
    }
    /**
    Place an add on the page.
    under ad_box_wrapper
    TODO: Specify where the ad should be displayed
    */
    function ad_loader() {
        var para = document.createElement("div"),
            element = document.getElementById("ad_box_wrapper");

        para.setAttribute("class", "boxy");
        element.appendChild(para);

        var element = $(".boxy");

        // add the add call to our element
        element.append('<div data-boxy="true" id="dfp_300x250_2" data-slot="300x250_2" data-size="300x250"></div>');

        var boxy_ad = $('[data-boxy="true"]');

        // initialize ads
        init_ads(boxy_ad);
        // Remove the data slot so we don't initialize again
        boxy_ad.removeAttr("data-slot");
        boxy_ad.removeAttr("data-boxy");

        element.removeAttr('class');

        //element.height(250);
    }

    var shell_count = 0;
    /**
    Create a "Shell" for dynamic content

    TODO: Specify where this should be injected
    TODO: Get rid of shell_count

    */
    function shell_loader() {
        /*
        I don't think this is necessary.
        There should be a way to create "shells" without having all this complexity and perhaps
         There is a way to pre-caculate the amount of data that is necessary, make the request then store it for further use.
        */
        var shell = document.createElement("div");

        shell.className = "article_shell" + shell_count;
        document.getElementById("ad_box_wrapper").appendChild(shell);

        var article_shell = $(shell).height(750);
        //article_shell.css("border", "1px solid black");

        article_loader('whatever', article_shell);

        shell_count++;
    }
    /**
        Fetch defaults for an API call
    */
    function get_data(limit) {
        var data = {};
        data.limit = limit;

        if(r_app.photoWidth){
            data.photo_width = r_app.photoWidth;
        }

        if(r_app.photoHeight){
            data.photo_height = r_app.photoHeight;
        }

        data.lead_photo__isnull =  'False';

        return data;
    }
    /**
    Create an HTML represietation of an anchor
    @param {item}
        {item.url} url to the item
        {item.lead_photo} photo for the item
        {item.h3_class} class for the item
        {item.title} title for the link (anchor text)
    @return {html} of the item specified
    */
    function create_html(item){

        return '<a href="'+ item.url +'">' + item.lead_photo +'<h3 '+ item.h3_class + '>'+ item.title +'</h3><span style="display:none">'+ item.url +' nav-stories</span></a>';
    }

    /**
    Error message in the event of an API error
    @return {html} error message in an LI
    */
    function get_error_message(){
        return "<li><h3>Something went wrong fetching the stories. Please try again later.</h3></li>";
    }
    /**
    Renders an item returned from an API call
    @param {item} item returned from an API call
    @param {element} Element to append to
    @returns Nothing
    */
    function render_item(item, element) {
        // var element = document.getElementById("a_wire_wrapper"),
        var article_link = document.createElement("li");

        if(item.start_time) {
            return null;
        }

        item.h3_class = '';
        // this assumes that the API has returned an image link.
        //  this is not the proper way of handling this.
        //  instead an accepted content type should be correct, unfortunately
        //  this version of the API does not return a content type and it's assumed
        //  that the lead_photo is a hard link to the photo :(
        if(item.lead_photo) {
            if(item.lead_photo.indexOf('img src') === -1){
                item.lead_photo = '<div class="scroller_img_wrap"><img src="'+ item.lead_photo + '" /></div>';
            }
        } else {
            item.lead_photo = '';
            item.h3_class = 'class="nav-stories-no-photo"';
        }
        // TODO: Generalize this.
        article_link.className = "scroll_loader_stories";
        element.appendChild(article_link);
        article_link.innerHTML = create_html(item);
    }
    /**
    Callback reciever for an api call, takes the generated json and a parent element to append to.
    @param {json} json returned from an API call
    @param {element} element to work with
    */
    function callback_receiver(json, element) {
        console.log(element);
        if(json.items.length === 1){
            // if we are here then nothing was returned from the api (empty section perhaps?)
            element.empty();
            element.prepend(get_error_message());
        } else {
            for(i=last_index; i < json.items.length; i++){
                render_item(json.items[i], element);
            }
        }
    }
    /**
    Make an ajax call, takes a url, data and element that will be acted on
    @param {url} URL to make the api call to
    @param {data} any data to send to the API
    @param {element} jQuery element to work with
    @returns nothing
    */
    function ajax_call(url, data, element){
        console.log(element);
        return $.ajax({
            url: url,
            data: data,
            type: "GET",
            dataType : "jsonp", // jsonp is here to prevent a cors request.
            cache: true,
          success: function( json, status) {
              callback_receiver(json, element);
          },
          error: function( xhr, status, errorThrown ) {
              console.log( "PROBLEM" );
              console.log( "Error: " + errorThrown );
              console.log( "Status: " + status );
              console.dir( xhr );
          },
          complete: function( xhr, status ) {
              console.log( "Run a message regarless of success." );
          }
        });
    }
    /**
    Creates a "Top Stories" div and poplates it with data returned from the API
    TODO (chapin): make a_wire_loader and article_loader work together
    */
    function a_wire_loader() {
        var wrapper = document.getElementById("ad_box_wrapper"),
            module = document.createElement("div"),
            title = document.createElement("h3"),
            link_wrap = document.createElement("ul");

        $(link_wrap).data('article-type', 'a-wire');
        module.id = "a_wire";
        title.innerHTML = "Top Stories";
        link_wrap.id = "a_wire_wrapper";

        console.log(wrapper);

        wrapper.appendChild(module);
        module.appendChild(title);
        module.appendChild(link_wrap);

        data = get_data(3);

        console.log(link_wrap);

        ajax_call("http://www.utsandiego.com/api/widgets/v1/news/section/top-stories/", data, link_wrap);
    }

    var article_count = 0;
    /**
    Loads up the article shell elements with data from the API
    @param {e} NOT USED
    @param {wrapper} element to load data into
    @returns Nothing
    */
    function article_loader(e, wrapper) {
        // console.log("ARTICLE LOADER.... LEEEOY JENKINS!!!!");
        // var wrapper = document.getElementsByClassName("article_shell" + article_count ),
        var div = $(document.createElement('div')),
            limit = ($("[class^=article_shell]").length)*3,
            // is this used?
            scroller = ($(window).scrollTop() + $(window).height()) - $("#ad_box_wrapper").offset().top,
            // container, should this have a function?
            more_title = $(document.createElement('h3')),
            // ul, probably should have some way of returning a container to be appended to, maybee?
            link_wrap = $(document.createElement('ul'));

        link_wrap.data('article-type', 'article');


        // change this to be a default?
        div.addClass("more_from_ut");
        // r_app.section_name can change, is this proper of should we have a variable passed in?
        more_title.text("Recent " + r_app.section_name);
        // What is link_wrapper, is it constant, couln't we add this when the element is created?
        link_wrap.addClass("link_wrapper");
        // is this necessary?
        // can't we dynamicly create a wrapper and inject it?
        article_count++;

        console.log(wrapper);
        // create the tree.
        div.append(more_title);
        div.append(link_wrap);

        wrapper.append(div);

        // get the setup data
        data = get_data(limit);

        console.log(link_wrap);

        ajax_call("http://www.utsandiego.com/api/widgets/v1/news/section/"+ r_app.section_url +"/", data, link_wrap[0]);
    }
    /**
    Public functions. IMPLICIT self
    This is for the initr to work properly, it will call init to make sure everything is
        initialized after the dom is loaded
    */
    return {
        init: function() {
            if(app.fetchFromCache === undefined){
                app.fetchFromCache = true;
            }
            self.init();
        },
        article_loader: function(e, el){
            self.article_loader(e, el);
            // article_loader(e, el);
        }
    }
}();