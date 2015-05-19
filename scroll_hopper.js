/**

SCROLL HOPPER! v1.0.0 - 2015-05-19
* https://github.com/mindgruve/initr
* Copyright (c) 2015 Russell Chapin | San Diego Union Tribune LLC; Licensed MIT 
 
1. Measure height of article div and sidebar div to find out how much remaining space is left from the bottom of the Facebook comments section. 

2. If that space is greater than 1000px, then create a wrapper div after the sidebar.

3. In the new wrapper div, append one 300px x 250px ad and then append a 100% x 650px wrapper containing the three most recent A Wire articles. 

4. Measure the remaining height of the wrapper div and divide that height by 1000px, which is the sum of one ad spot and one article wrapper div.

5. Above quotient will first set the value for the number of ad variables and then be multiplied by three to set as the value of the variable that dictates the number of articles called through AJAX. 

6. The object containing all of the articles will then be split in to triplets, wrapped inside parent containers and rendered in to the DOM simultaneously with the ad spots.

*/

var r_app = window.r_app || {};

r_app.scroll_loader = function() {

    $(window).load(function() {
        // call the init function eventually
        window.setTimeout(init, 2000);
    });

    var article_cache = {},
        articles_per_box = 3,
        last_index = 0;

    function init(){
        r_app._article_height = $("article").height();
        var content_height = $("article").height();
            rendered_sidebar = $("#sidebar").height();
            //real_wrap_height = $("article" ).height() - $("#sidebar").height();

        console.log( "Ad box test is ready." );
        /**
        * If space below sidebar is > 800px then work needs to be done.
        */

        if (content_height - rendered_sidebar > 1200 && $(window).width() > 1200){

            ad_box_draw(0);
/*
            try {
                // if facebook comments are enabled on this page
                if (FB != undefined) {
                    // listen for the render callback
                    FB.Event.subscribe("xfbml.render", recalc);
                }
            } 
            catch(err) {
                console.log(err);
            }
*/

        }
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

//var mod_number;
    function  ad_box_draw(ad_number) {
        console.log( "Ad box is drawing." );

        var para = document.createElement("div"),
            element = $('<div id="ad_box_wrapper" class="span3 col alpha omega"></div>');
            auto_ad();

            
            element.height(($("article").height() - $("#sidebar").height()) - 1200);
            //element.height(($("#comments-module").offset().top + $("#comments-module").outerHeight(true)));
            // push it into the dom
            element.insertAfter("#sidebar");
            mod_number = ad_number;
            article_loader();
            //mod_loader();
    }

    function auto_ad(){
        var para = document.createElement("div"),
            element = $("#sidebar");
            // add the add call to our element
            element.append('<div data-boxy="true" id="dfp_300x250_2" data-slot="300x250_2" data-size="300x250" class="auto_boxy"></div>');
        var boxy_ad = $('[data-boxy="true"]');
            // initialize ads
            init_ads(boxy_ad);
            // remove the data slot so we don't initialize again
            boxy_ad.removeAttr("data-slot");
            boxy_ad.removeAttr("data-boxy");
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
    function render_item(item, element, i) {
        // var element = document.getElementById("a_wire_wrapper"),
        var article_link = document.createElement("li");

        if(item.start_time) {
            return null;
        }
        item.h3_class = '';
        // This assumes that the API has returned an image link.
        // this is not the proper way of handling this.
        // This version of the API does not return a content type and it's assumed
        // that the lead_photo is a hard link to the photo
        if(item.lead_photo) {
            if(item.lead_photo.indexOf('img src') === -1){
                item.lead_photo = '<div class="scroller_img_wrap"><img src="'+ item.lead_photo + '" /></div>';
            }
        } else {
            item.lead_photo = '';
            item.h3_class = 'class="nav-stories-no-photo"';
        }
        /*
        if(i && (i == 0 || (i%3) == 0)){
            console.log(i);
            article_link.className = "scroll_loader_stories triplet";
        }
        */
        //else{
            article_link.className = "scroll_loader_stories";
        //}
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
    Callback reciever for an api call, takes the generated json and a parent element to append to.
    @param {json} json returned from an API call
    @param {element} element to work with
    */
    var ad_match = 0;
    function box_creator(json, element) {

        if(json.items.length === 1){
            // if we are here then nothing was returned from the api (empty section perhaps?)
            element.empty();
            element.prepend(get_error_message());
        } else {
            //  For each 3 json items:
            //  Create a container,
            //  Create the story box,
            //  Populate the story box
            //  Create an ad-box
            //  Populate the ad-box
            //  Done.

            var div = $(document.createElement('div')),
                wrapper = $("#ad_box_wrapper"),
                // element = $(element),
                // is this used?
                //scroller = ($(window).scrollTop() + $(window).height()) - $("#ad_box_wrapper").offset().top,
                // container, should this have a function?
                more_title = $(document.createElement('h3')),
                recommend_title = $(document.createElement('h3')),
                // ul, probably should have some way of returning a container to be appended to, maybee?
                link_wrap = $(document.createElement('ul'));

                link_wrap.data('article-type', 'article');
            console.log(element);

            var ad_number = 0;
            for(i=0; i < json.items.length; i++){
                    render_item(json.items[i], element, i);
                    if(i%3 === 0){
                        ad_loader(ad_number);
                        recommend_title.insertAfter($(".count"+count));
                        recommend_title.text('More From ' + r_app.section_name );
                        ad_number++;
                    }
            }
        }
    

    }
    /**
    Make an ajax call, takes a url, data and element that will be acted on
    @param {url} URL to make the api call to
    @param {data} any data to send to the API
    @param {element} jQuery element to work with
    @param {callback} is a function callback
    @returns nothing
    */
    function ajax_call(url, data, element, callback){
        console.log(element);
        return $.ajax({
            url: url,
            data: data,
            type: "GET",
            dataType : "jsonp", // jsonp is here to prevent a cors request.
            cache: true,
          success: function( json, status) {
              callback(json, element);
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
    var count = 0;
    function ad_loader(count) {
        $("#ad_box_wrapper").append('<div data-boxy="true" id="dfp_300x250_2" data-slot="300x250_2" data-size="300x250" class="count'+count+'"></div>');
        var boxy_ad = $('[data-boxy="true"]');
        //initialize ads
        init_ads(boxy_ad);
        //remove the data slot so we don't initialize again
        boxy_ad.removeAttr("data-slot");
        boxy_ad.removeAttr("data-boxy");
        //$('.boxy').removeAttr('class');
        // count++;
    }
    /**
    Loads up the article shell elements with data from the API
    @param {e} NOT USED
    @param {wrapper} element to load data into 
    @returns Nothing
    */
    function article_loader(e, wrapper) {
      
        var limit = Math.round($("#ad_box_wrapper").height()/1200)*3,
            link_wrap = $("#ad_box_wrapper");
            
        var data = get_data(limit);
        
        ajax_call("/api/widgets/v1/news/section/"+ r_app.section_url +"/", data, link_wrap[0], box_creator);

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
        }
    }

}();
