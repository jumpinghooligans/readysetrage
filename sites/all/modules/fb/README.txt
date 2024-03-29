Drupal for Facebook
-------------------

Project Home:
http://www.drupalforfacebook.org, http://drupal.org/project/fb

Primary author and maintainer: Dave Cohen (http://www.dave-cohen.com/contact)
Do  NOT contact  the  maintainer  with a question  that  can be  easily
answered with a web search.  You may not receive a reply.

Branch: master (version 3.x for Drupal 7.x)

This file is more current than online documentation.  When in doubt,
trust this file.  Online documentation: http://drupal.org/node/195035,
has more detail and you should read it next..

To upgrade from Drupal 6 to Drupal 7:
- Upgrade your D6 version to RC7 or later.  Run update.php and make sure everything seems to work.  Then upgrade drupal and all modules to D7 branch.


To upgrade from on D7 version to the next:
- Read the upgrade instructions: http://drupal.org/node/936958

To install:

- Make sure you have an up-to-date PHP client from facebook.
  Download from http://github.com/facebook/php-sdk.
  Extract the files, and place them in sites/all/libraries/facebook-php-sdk.

  Or, To find the php-sdk in any other directory, edit your
  settings.php to include a line similar to this (add to section where
  $conf variable is defined, or very end of settings.php. And
  customize the path as needed.):

  $conf['fb_api_file'] = 'sites/all/libraries/facebook-php-sdk/src/facebook.php';

  See also http://drupal.org/node/923804

- Your theme needs the following attribute at the end of the <html> tag:

  xmlns:fb="http://www.facebook.com/2008/fbml"

  Typically, this means copying the html.tpl.php file from /modules/system into the
  templates folder of your theme and modifying it. More detail can be found at
  http://www.drupalforfacebook.org/node/1106. Note this
  applies to themes used for Facebook Connect, iframe Canvas Pages, and Social
  Plugins (i.e. like buttons). Without this attribute, IE will fail.

- To support canvas pages, url rewriting and other settings must be
  initialized before modules are loaded, so you must add this code to
  your settings.php. This is easily done by adding these two lines to
  the end of sites/default/settings.php (or
  sites/YOUR_DOMAIN/settings.php).

  include "sites/all/modules/fb/fb_url_rewrite.inc";
  include "sites/all/modules/fb/fb_settings.inc";

  (Change include paths if modules/fb is not in sites/all.)

- Go to Administer >> Modules >> List and enable the Facebook
  modules that you need.

  Enable fb.module for Social Plugins.

  Enable fb_devel.module and keep it enabled until you have everything
  set up. You should disable this on your live server once you are
  certain facebook features are working. (Note this requires
  http://drupal.org/project/devel, which is well worth installing
  anyway.)

  Enable fb_app.module and fb_user.module if you plan to create
  facebook applications.

  Enable fb_connect.module for Facebook Connect and/or
  fb_canvas.module for Canvas Page apps.

  Create a new Text Format that does not restrict/clean HTML tags and use it
  in blocks and nodes. Other Text Formats (formerly called Input Formats in D6)
  like the built-in Full HTML Text Format actually mangle FB tags like <fb:like>.

  Pages at http://drupal.org/node/932690 will help you decide which
  other modules you need to enable for your particular needs.


To support Facebook Connect, Canvas Pages, and/or Social Plugins that
require an Application, read on...

- You must enable clean URLs. If you don't, some links that drupal
  creates will not work properly on canvas pages.

- Create an application on Facebook, currently at
  http://www.facebook.com/developers/createapp.php. Fill in the
  minimum required to get an apikey and secret. If supporting canvas
  pages, specify a canvas name, too.  You may ignore other settings
  for now.

- Go to Administer >> Site Building >> Facebook Applications and click
  the Add Applicaiton tab.  Use the app id, apikey and secret that
  Facebook has shown you.  Hopefully other settings will be
  self-explanitory.  When you submit your changes, Drupal for Facebook
  will automatically set the callback URL and some other properties
  which help it work properly.


Troubleshooting:
---------------

Reread this file and follow instructions carefully.

Read http://drupal.org/node/933994, and all the module documentation
on http://drupal.org/node/912614.

Enable the fb_devel.module and add the block it provides (called
"Facebook Devel Page info") to the footer of your Facebook theme.
fb_devel.module will catch some errors and write useful information to
Drupal's log and status page.

Disable Global Redirect, if you have that module installed. Users
have reported problems with it and Drupal for Facebook.  Any module
which implements custom url rewrites could interfere with canvas page
and profile tab support.

Bug reports and feature requests may be submitted.
Here's an idea: check the issue queue before you submit
http://drupal.org/project/issues/fb

If you do submit an issue, start the description with "I read the
README.txt from start to finish," and you will get a faster, more
thoughtful response. Seriously, prove that you read this far.

Below are more options for your settings.php. Add the PHP shown below
to the very end of your settings.php, and modify the paths accordingly
(i.e. where this example has "sites/all/modules/fb", you might need
"profiles/custom/modules/fb").




//// Code to add to settings.php:
/////////////////////////////////

/**
 * Drupal for Facebook settings.
 */

if (!is_array($conf))
  $conf = array();

$conf['fb_verbose'] = TRUE; // debug output
//$conf['fb_verbose'] = 'extreme'; // for verbosity fetishists.

// More efficient connect session discovery.
// Required if supporting one connect app and different canvas apps.
//$conf['fb_apikey'] = '123.....XYZ'; // Your connect app's apikey goes here.

// Enable URL rewriting (for canvas page apps).
include "sites/all/modules/fb/fb_url_rewrite.inc";
include "sites/all/modules/fb/fb_settings.inc";

// end of settings.php
