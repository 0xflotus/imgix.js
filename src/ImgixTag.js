var util = require('./util.js'),
    targetWidths = require('./targetWidths.js');

var ImgixTag = (function() {
  function ImgixTag(el) {
    this.el = el;

    if (this.el.hasAttribute('ix-initialized')) {
      return;
    }
    this.el.setAttribute('ix-initialized', 'ix-initialized');

    this.ixPathVal = el.getAttribute('ix-path');
    this.ixParamsVal = el.getAttribute('ix-params');
    this.ixSrcVal = el.getAttribute('ix-src');

    if (this.ixPathVal && !imgix.config.host) {
      throw new Error('You must set a value for `imgix.config.host` to use `ix-path` and `ix-params`');
    }

    this.baseParams = this._extractBaseParams();
    this.baseUrl = this._buildBaseUrl();

    this.el.setAttribute('sizes', this.sizes());
    this.el.setAttribute('srcset', this.srcset());
    this.el.setAttribute('src', this.src());
  }

  ImgixTag.prototype._extractBaseParams = function() {
    if (this.ixParamsVal) {
      var params = JSON.parse(this.ixParamsVal);
    } else {
      // If the user used `ix-src`, we have to extract the base params
      // from that string URL.
      var lastQuestion = this.ixSrcVal.lastIndexOf('?'),
          paramString = this.ixSrcVal.substr(lastQuestion + 1),
          splitParams = paramString.split('&'),
          params = {};

      for (var i = 0, splitParam; i < splitParams.length; i++) {
        splitParam = splitParams[i].split('=');

        params[splitParam[0]] = splitParam[1];
      }
    }

    // Encode any passed Base64 variant params
    for (var key in params) {
      if (key.substr(-2) === '64') {
        params[key] = util.encode64(params[key]);
      }
    }

    return params;
  };

  ImgixTag.prototype._buildBaseUrl = function() {
    if (this.ixSrcVal) {
      return this.ixSrcVal;
    } else {
      var path = this.ixPathVal,
          protocol = 'http';
      if (imgix.config.useHttps) {
        protocol += 's';
      }

      var url = protocol + '://' + imgix.config.host,
          hostEndsWithSlash = imgix.config.host.substr(-1) === '/',
          pathStartsWithSlash = path[0] === '/'

      // Make sure we don't end up with 2 or 0 slashes between
      // the host and path portions of the generated URL
      if (hostEndsWithSlash && pathStartsWithSlash) {
        url += path.substr(1);
      } else if (!hostEndsWithSlash && !pathStartsWithSlash) {
        url += '/' + path;
      } else {
        url += path;
      }

      url += '?'
      var param;
      for (var key in this.baseParams) {
        param = this.baseParams[key];
        url += encodeURIComponent(key) + '=' + encodeURIComponent(param);
      }

      return url;
    }
  };

  ImgixTag.prototype.src = function() {
    return this.baseUrl;
  };

  ImgixTag.prototype.srcset = function() {
    // TODO return a comma-separated list of `url widthDescriptor` pairs,
    // scaled appropriately to the same aspect ratio as the base image
    // as appropriate.

    for (var i = 0, targetWidth; i < targetWidths.length; i++) {
      targetWidth = targetWidths[i];
    }

    // Until this is implemented, just returning an empty string
    return '';
  };

  ImgixTag.prototype.sizes = function() {
    var existingSizes = this.el.getAttribute('sizes');

    if (existingSizes) {
      return existingSizes;
    } else {
      return '100vw';
    }
  };

  return ImgixTag;
}());

module.exports = ImgixTag;
