
// This function called by facebook's javascript when it is loaded.
// http://developers.facebook.com/docs/reference/javascript/
window.fbAsyncInit = function() {

  if (typeof(Drupal.settings.fb) == 'undefined') {
    debugger; // this should not be reached.
  }
  FB.init(Drupal.settings.fb.fb_init_settings);

  FB.XFBML.parse();

  // Async function to complete init, only if session state is unknown.
  // (Avoid doing this when third-party cookies disabled.)
  if (!Drupal.settings.fb.fb_init_settings.session) {
    FB.getLoginStatus(function(response) {
      var status = {'session' : response.session, 'response': response};
      jQuery.event.trigger('fb_init', status);  // Trigger event for third-party modules.

      FB_JS.sessionChange(response);

      FB_JS.eventSubscribe();
    });
  }
  else {
    jQuery.event.trigger('fb_init', {'session' : Drupal.settings.fb.fb_init_settings.session});  // Trigger event for third-party modules.
    FB_JS.eventSubscribe();
    FB_JS.sessionSanityCheck();
  }
};

FB_JS = function(){};

/**
 * Tell facebook to notify us of events we may need to act on.
 */
FB_JS.eventSubscribe = function() {
  // Use FB.Event to detect Connect login/logout.
  FB.Event.subscribe('auth.sessionChange', FB_JS.sessionChange);

  // Q: what the heck is "edge.create"? A: the like button was clicked.
  FB.Event.subscribe('edge.create', FB_JS.edgeCreate);

  // Other events that may be of interest...
  //FB.Event.subscribe('auth.login', FB_JS.debugHandler);
  //FB.Event.subscribe('auth.logout', FB_JS.debugHandler);
  //FB.Event.subscribe('auth.statusChange', FB_JS.debugHandler);
  //FB.Event.subscribe('auth.sessionChange', FB_JS.debugHandler);
}

/**
 * Helper parses URL params.
 *
 * http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
 */
FB_JS.getUrlVars = function(href) {
  var vars = [], hash;
  var hashes = href.slice(href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++)
  {
    hash = hashes[i].split('=');
    vars[hash[0]] = hash[1];
    if (hash[0] != 'fbu')
      vars.push(hashes[i]); // i.e. "foo=bar"
  }
  return vars;
}

/**
 * Reload the current page, whether on canvas page or facebook connect.
 */
FB_JS.reload = function(destination) {
  // Determine fbu.
  var session = FB.getSession();
  var fbu;
  if (session != null)
    fbu = session.uid;
  else
    fbu = 0;

  // Avoid infinite reloads
  ///@TODO - does not work on iframe because facebook does not pass url args to canvas frame when cookies not accepted.  http://forum.developers.facebook.net/viewtopic.php?id=77236
  var vars = FB_JS.getUrlVars(window.location.href);
  if (vars.fbu == fbu) {
    return; // Do not reload (again)
  }

  // Determine where to send user.
  if (typeof(destination) != 'undefined' && destination) {
    // Use destination passed in.
  }
  else if (typeof(Drupal.settings.fb.reload_url) != 'undefined') {
    destination = Drupal.settings.fb.reload_url;
  }
  else {
    destination = window.location.href;
  }

  // Split and parse destination
  var path;
  if (destination.indexOf('?') == -1) {
    vars = [];
    path = destination;
  }
  else {
    vars = FB_JS.getUrlVars(destination);
    path = destination.substr(0, destination.indexOf('?'));
  }

  // Add fbu to params before reload.
  vars.push('fbu=' + fbu);

  // Use window.top for iframe canvas pages.
  destination = path + '?' + vars.join('&');

  if(Drupal.settings.fb.reload_url_fragment) {
    destination = destination + "#" + Drupal.settings.fb.reload_url_fragment;
  }

  // Feedback that entire page may be reloading.
  // @TODO improve the appearance of this, make it customizable.
  jQuery('body').prepend('<div id="fb_js_pb" class="progress"><div class="bar"><div class="filled"></div></div></div>');

  window.top.location = destination;
  //alert(destination);
};

// Facebook pseudo-event handlers.
FB_JS.sessionChange = function(response) {
  if (response.status == 'unknown') {
    // @TODO can we test if third-party cookies are disabled?
  }

  var status = {'changed': false, 'fbu': null, 'session': response.session, 'response' : response};

  if (response.session) {
    status.fbu = response.session.uid;
    if (Drupal.settings.fb.fbu != status.fbu) {
      // A user has logged in.
      status.changed = true;
    }
  }
  else if (Drupal.settings.fb.fbu) {
    // A user has logged out.
    status.changed = true;

    // Sometimes Facebook's invalid cookies are left around.  Let's try to clean up their crap.
    // Can get left behind when third-party cookies disabled.
    FB_JS.deleteCookie('fbs_' + FB._apiKey, '/', '');
    FB_JS.deleteCookie('fbs_' + Drupal.settings.fb.apikey, '/', '');
  }

  if (status.changed) {
    // fbu has changed since server built the page.
    jQuery.event.trigger('fb_session_change', status);

    // Remember the fbu.
    Drupal.settings.fb.fbu = status.fbu;
  }

};

FB_JS.edgeCreate = function(href, widget) {
  var status = {'href': href};
  FB_JS.ajaxEvent('edge.create', status);
};

// Helper function for developers.
FB_JS.debugHandler = function(response) {
  debugger;
};

// JQuery pseudo-event handler.
FB_JS.sessionChangeHandler = function(context, status) {
  // Pass data to ajax event.
  var data = {
    'event_type': 'session_change'
  };

  if (status.session) {
    data.fbu = status.session.uid;
    // Suppress facebook-controlled session.
    data.fb_session_handoff = true;
  }

  FB_JS.ajaxEvent(data.event_type, data);
  // No need to call window.location.reload().  It will be called from ajaxEvent, if needed.
};


// Helper to pass events via AJAX.
// A list of javascript functions to be evaluated is returned.
FB_JS.ajaxEvent = function(event_type, request_data) {
  if (Drupal.settings.fb.ajax_event_url) {

    // Session data helpful in ajax callbacks.  See fb_settings.inc.
    request_data.fb_js_session = JSON.stringify(FB.getSession());
    if (typeof(Drupal.settings.fb_page_type) != 'undefined') {
      request_data.fb_js_page_type = Drupal.settings.fb_page_type;
    }

    // FB._apikey might be an apikey or might be an appid!
    if (FB._apiKey == Drupal.settings.fb.fb_init_settings.appId ||
        FB._apiKey == Drupal.settings.fb.fb_init_settings.apiKey) {
      request_data.apikey = Drupal.settings.fb.fb_init_settings.apiKey;
    }

    // Other values to pass to ajax handler.
    if (Drupal.settings.fb.controls) {
      request_data.fb_controls = Drupal.settings.fb.controls;
    }

    jQuery.ajax({
      url: Drupal.settings.fb.ajax_event_url + '/' + event_type,
      data : request_data,
      type: 'POST',
      dataType: 'json',
      success: function(js_array, textStatus, XMLHttpRequest) {
        if (js_array.length > 0) {
          for (var i = 0; i < js_array.length; i++) {
            eval(js_array[i]);
          }
        }
        else {
          if (event_type == 'session_change') {
            // No instructions from ajax, reload entire page.
            FB_JS.reload();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var header = jqXHR.getResponseHeader();
        var headers = jqXHR.getAllResponseHeaders();
        debugger;
        // @TODO: handle error, but how?
        FB_JS.reload();
        //alert('FB_JS.ajaxEvent error handler called.');
      }
    });
  }
};

// Delete a cookie.
// Facebook's JS SDK attempts to delete, but I'm not convinced it always works.
FB_JS.deleteCookie = function( name, path, domain ) {
  document.cookie = name + "=" +
    ( ( path ) ? ";path=" + path : "") +
    ( ( domain ) ? ";domain=" + domain : "" ) +
    ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
};

// Test the FB settings to see if we are still truly connected to facebook.
FB_JS.sessionSanityCheck = function() {
  if (!Drupal.settings.fb.checkSemaphore) {
    Drupal.settings.fb.checkSemaphore=true;
    FB.api('/me', function(response) {
      if (response.id != Drupal.settings.fb.fbu) {
	// We are no longer connected.
	var status = {'changed': true, 'fbu': null, 'check_failed': true};
	jQuery.event.trigger('fb_session_change', status);
      }
      Drupal.settings.fb.checkSemaphore=null;
    });
  }
};


/**
 * Drupal behaviors hook.
 *
 * Called when page is loaded, or content added via javascript.
 */
(function ($) {
  Drupal.behaviors.fb = {
    attach : function(context) {
      // Respond to our jquery pseudo-events
      var events = jQuery(document).data('events');
      if (!events || !events.fb_session_change) {
	jQuery(document).bind('fb_session_change', FB_JS.sessionChangeHandler);
      }

      // Once upon a time, we initialized facebook's JS SDK here, but now that is done in fb_footer().

      if (typeof(FB) != 'undefined') {
        // Render any XFBML markup that may have been added by AJAX.
        $(context).each(function() {
          var elem = $(this).get(0);
          FB.XFBML.parse(elem);
        });
      }

      // Markup with class .fb_show should be visible if javascript is enabled.  .fb_hide should be hidden.
      jQuery('.fb_hide', context).hide();
      jQuery('.fb_show', context).show();
    }
  };

})(jQuery);
