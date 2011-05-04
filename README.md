j18n
=====================================================
This plugin enables your rails i18n strings in your javascript.

Requirements
=====
Rails3

Installation
=====
In your Gemfile

    gem 'j18n', :git => 'git://github.com/giniedp/j18n.git'

Then run
    
    bundle install
    
and

    rails generate j18n:install
    
This will generate (**overwrite**) an initializer at

    config/initializers/j18n.rb
    
Modify that file with your settings

    J18n.setup do |config|
      # Set the javascript output file path
      config.output_path = "public/javascripts/j18n.js"
      
      # If true, the javascript file will be generated on application startup
      config.build_on_boot = false
    end

Include the javascript in your application layout or wherever you need the i18n

    = javascript_include_tag 'j18n'

You can also use a generator to build the i18n file

    rails generate j18n:regenerate
    
Usage
=====


Copyright
=====

Copyright (c) 2010 Alexander Gräfenstein. See LICENSE for details.
