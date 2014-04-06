function adjust_navigation() {
  var nav=document.getElementById("sitelink")
  nav.innerHTML=ffmapConfig.sitename;
  nav.href=ffmapConfig.url;
};

function parse_hash_parameters() {
  var parameters = {};
  var parts;
  var fragment = window.location.hash.substring(1);
  fragment.split(";").forEach(function (p) {
    parts = p.split("=");
    if (parts.length > 1) {
      parameters[parts[0]] = parts[1];
    } else {
      parameters[parts[0]] = "";
    }
  });
  return parameters;
};

function create_filter(filter_string) {
  var filter;
  var regexes = [];
  if (filter_string) {
    filter_string.split(",").forEach(function (p) {
      p = p.replace(/\./g, "\\.");
      p = p.replace(/\*/g, ".*");
      regexes.push(new RegExp("^" + p + "$", "i"));
    });
    filter = function (value) {
      return regexes.some(function (r) { return r.test(value); });
    }
  } else {
    filter = function () {
      return true;
    }
  }
  return filter;
}
