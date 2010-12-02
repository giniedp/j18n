I18n = {
  locale : "en",
  getLocale : function(){
    return I18n.locale;
  },
  dictionary : {},
  addValue : function(key, value){
    var path = key.split(".");
    var dict = I18n.dictionary;
    while(path.length > 1){
      key = path.shift();
      if (typeof(dict[key]) != "object"){
        dict[key] = {};
      }
      dict = dict[key];
    }
    dict[path.shift()] = value;
  },
  getValue : function(key){
    var path = key.split(".");
    var dict = I18n.dictionary;
    while(path.length > 0){
      dict = dict[path.shift()];
      if(!dict){
        return null;
      }
    }
    return dict;
  },
  makeKey : function(locale, scope, key){
    var result = [];
    if (locale) result.push(locale);
    if (scope) result.push(scope);
    if (key) result.push(key);
    return result.join(".");
  },
  pluralizationStrategies : {
    defaultStrategy : function(count){
      return (count == 1 ? "one" : "other");
    }
  },
  pluralize : function(locale, value, count){
    var strategy = I18n.pluralizationStrategies[locale];
    if (!strategy){
      strategy = I18n.pluralizationStrategies.defaultStrategy;
    }
    var category = strategy(count);
    if (value[category]){
      return value[category];
    } 
    return value;
  },
  interpolate : function(str, key, value){
    str = str.replace("%{" + key + "}", value);   // rails 3
    return str.replace("{{" + key + "}}", value); // rails 2
  },
  translate : function(key, options){
    if (typeof(options) != "object"){
      options = {};
    }
    var locale = I18n.getLocale();
    
    // The translate method also takes a :scope option which can contain one or 
    // more additional keys that will be used to specify a “namespace” or scope 
    // for a translation key:
    var scope = options.scope;
    if (typeof(scope) == "object"){
      scope = scope.join(".");
    }

    // When a 'default' or 'defaultValue' option is given, its value will be 
    // returned if the translation is missing. 
    var defaultValue = (options.defaultValue || options["default"]);
    
    if (typeof(key) == "string"){
      return I18n.performTranslation(locale, scope, key, defaultValue, options);
    }
    
    // To look up multiple translations at once, an array of keys can be passed
    var result = [];
    for (var i = 0; i < key.length; i++) {
      result.push(I18n.performTranslation(locale, scope, key[i], defaultValue, options));
    };
    return result;
  },
  t : function(key, options){
    return I18n.translate(key, options);
  },
  performTranslation : function(locale, scope, key, defaultValue, interpolation){
    var key = I18n.makeKey(locale, scope, key);
    var value = I18n.getValue(key);

    if (!value){
      value = defaultValue;
    }
    if (!value){
      value = "Translation missing for: " + key;
    }
    if (interpolation.count){
      value = I18n.pluralize(locale, value, interpolation.count);
    }
    for (var key in interpolation){
      value = I18n.interpolate(value, key, interpolation[key]);
    }
    return value;
  }
}; 

// Languages vary in how they handle plurals of nouns or unit expressions
// Some languages have two forms, like English; some languages have only a 
// single form; and some languages have multiple forms.
// You can define more pluralization stratiges by adding functions to the 
// I18n.pluralizationStrategies object. Here is an example for russian pluralization
// More information for pluralization rulse can be found at:
// http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
I18n.pluralizationStrategies["ru"] = function(count){
  if ((count % 10 == 1) && (count % 100 != 11)){
    return "one";
  } else if ((count % 10) >= 2 && (count % 10) <= 4 && !((count % 100) >= 12 && (count % 100) <= 14)){
    return "few";
  } else if ((count % 10) == 0 || ((count % 10) >= 5 && (count % 10) <= 9) || ((count % 100) >= 11 && (count % 100) <= 14)){
    return "many";
  } else {
    return "other";
  }
};
var Router = {
  
  settings : {
    protocol : null,
    host : null,
    port : null,
    path : null
  },

  // collection of named routes
  Routes : {},  
  
  generate : function(name, parameters){
    if (arguments.length == 0){
      throw("no arguments given");
    }
    
    var route = Router.Routes[name];
    if (route == undefined){
      throw("no route defined with name: " + name);
    }
    
    // replace cloze route with values
    if (parameters.length == 1 && typeof(parameters[0]) == "object"){
      for(var key in parameters[0]){
        var value = parameters[0][key];
        if (route.match(":" + key)){
          route = Router.replaceHelper(":" + key, route, value);
        } else {
          route += [route.match(/\?/) ? "&" : "?", key, "=", value].join("");
        }
      }
    } else {
      for (var i = 0; i < parameters.length; i++){
        route = Router.replaceHelper(":\\w+", route, parameters[i]);
      }   
    }
    
    // blank out all remaining params
    while(/:\w+/.test(route)){
      route = route.replace(/:\w+/, "");
    }
    
    // blank out all optional params
    while(/\(.*\)/.test(route)){
      route = route.replace(/\(.*\)/, "");
    }
    return route;
  },
  
  replaceHelper : function(key, string, value){
    var optionalExp = "\\([a-zA-Z0-9\\/\\$\\-\\_\\.\\+\\!\\*\\'\\,]*" + key;
    var leadingExp = "^(([a-zA-Z0-9\\/\\$\\-\\_\\.\\+\\!\\*\\'\\,])*(" + key + "))"
    var optionalMatch = new RegExp(optionalExp).exec(string);
    var leadingMatch = new RegExp(leadingExp).exec(string);

    if (optionalMatch != null && leadingMatch == null) {
      // has only optional parameters e.g. /path(/:bar)
      var match = optionalMatch[0];
      var start = optionalMatch.index;

      var count = 0;
      var length = 0;      
      var chars = string.substring(start).split("");
      // search closing bracket
      for (var i = 0; i < chars.length; i++){
        length += 1;
        if (chars[i] == "("){ count += 1; }
        if (chars[i] == ")"){ count -= 1; }
        if (count == 0){ break; }
      }
      var end = start + length;      
      string =  string.substring(0, start) + string.substring(start + 1, end - 1) + string.substring(end);
    }
    string = string.replace(new RegExp(key), value);
    return string;
  },
  
  generateBase : function(){
    var result = "";
    
    if (Router.settings.protocol != null){
      result += (Router.settings.protocol + "://");
    } else {
      result += (window.location.protocol + "//");
    }
    
    if (Router.settings.host != null){
      result += Router.settings.host;
    } else {
      result += window.location.hostname;
    }
    
    if (Router.settings.port != null){
      result += ":" + Router.settings.port;
    } else if (window.location.port != "") {
      result += ":" + window.location.port;
    }
    
    if (Router.settings.path != null){
      result += ":" + Router.settings.path;
    }
    
    return result;
  },
  
  // adds a named route
  pushRoute : function(name, route){
    pathName = name + "_path";
    urlName = name + "_url";
    Router.Routes[name] = route;
    
    Router[pathName] = new Function(pathName, 
      "return Router.generate('" + name + "', arguments);");
      
    Router[urlName] = new Function(urlName, 
      "return Router.generateBase() + Router.generate('" + name + "', arguments);");
  }
};