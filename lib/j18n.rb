require "fileutils"

module J18n
  pwd = File.expand_path(File.dirname(__FILE__))

  mattr_accessor :source_path
  @@source_path = File.join(File.dirname(__FILE__), 'javascripts', 'j18n.js')

  mattr_accessor :output_path
  @@output_path = "public/javascripts/j18n.js"
      
  mattr_accessor :i18n_path
  @@i18n_path = "public/javascripts/j18n.locales.js"

  mattr_accessor :build_on_boot
  @@build_on_boot = false
  
  def self.setup
    yield self
  end
  
  class Railtie < Rails::Railtie
    generators do
      require File.join(File.dirname(__FILE__), "generators", "install_generator.rb")
      require File.join(File.dirname(__FILE__), "generators", "regenerate_generator.rb")
    end
    
    initializer "j18n.initialize" do |app|
      # nothing to do
    end
    
    config.after_initialize do |app|
      if (J18n.build_on_boot)
        J18n::Builder.build()
      end
    end
  end
  
  class Builder
    include FileUtils
    
    def self.build
      FileUtils.copy_file(J18n.source_path, J18n.output_path) unless File.exists?(J18n.output_path)
      
      locales = I18n.backend.instance_eval do
        init_translations unless initialized?
        translations.to_json
      end
      File.delete(J18n.i18n_path) if File.exists?(J18n.i18n_path)
      File.open(J18n.i18n_path, 'w') do |f|
        f.print("(function(){")
        f.print("  var I18n = this.I18n;")
        f.print("  I18n.dictionary = #{locales.to_s};\n")
        f.print("  I18n.locale = '#{I18n.default_locale.to_s}';")
        f.print("}());")
      end
    end
  end
end