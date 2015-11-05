function staticContent() {
  var links = [];

  var aLinks = $.makeArray($('a[href]').map(function(i,el) { return $(el).attr('href'); }));
  var linkLinks = $.makeArray($('link[href]').map(function(i,el) { return $(el).attr('href'); }));
  var scriptLinks = $.makeArray($('script[src]').map(function(i,el) { return $(el).attr('src'); }));
  var imgLinks = $.makeArray($('img[src]').map(function(i,el) { return $(el).attr('href'); }));
  var iframeLinks = $.makeArray($('iframe[src]').map(function(i,el) { return $(el).attr('src'); }));
  var objectLinks = $.makeArray($('object[data]').map(function(i,el) { return $(el).attr('data'); }));
  var embedLinks = $.makeArray($('embed[src]').map(function(i,el) { return $(el).attr('src'); }));
  var frameLinks = $.makeArray($('frame[src]').map(function(i,el) { return $(el).attr('src'); }));
  var sourceLinks = $.makeArray($('source[src]').map(function(i,el) { return $(el).attr('src'); }));

  // form[action] + for each form.input { "form.input.name=form.input.value" }
  var formLinks = $.makeArray($('form').map(function(i,el) { 
    var action = $(el).attr('action'); 
    var elements = $(el).find('input').map(function(i, e) { 
      var name = $(e).attr('name') || $(e).attr('id') || "";
      var value = $(e).attr('value') || "";
      return name + "=" + value;
    });

    var search = elements.toArray().join('&')

    if (action !== undefined && action.indexOf('?') > -1) {
      return action + "&" + search;
    } else {
      return action + "?" + search;
    }
  }));

  var out = new Array()
  out = out.concat(aLinks, linkLinks, scriptLinks, imgLinks, iframeLinks, objectLinks, embedLinks, frameLinks, sourceLinks, formLinks);
  return out
}

// Build origin (scheme://host:port), normalize all scraped urls, send back to popup.
var originURL = new URL(window.location.href);
var origin = originURL.protocol + "//" + originURL.host;
var out = [];
var content = staticContent()

for (var i = 0; i < content.length; i++) {
  var url = new URL(content[i], origin);
  out.push(url.href)
}

chrome.runtime.sendMessage({results: out});
