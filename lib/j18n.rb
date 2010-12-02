module J18n
  pwd = File.expand_path(File.dirname(__FILE__))

  mattr_accessor :source_path
  @@source_path = File.join(File.dirname(__FILE__), 'javascripts', 'j18n.js')
    
  mattr_accessor :output_path
  @@output_path = "public/javascripts/j18n.js"

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
    def self.build
      locales = I18n.backend.instance_eval do
        init_translations unless initialized?
        translations.to_json
      end
    
      js_source = J18n.source_path
      js_target = J18n.output_path
      
      File.delete(js_target) if File.exists?(js_target)
      
      File.open(js_target, 'w') do |f|
        File.open(js_source, "r") do |file|
          while (line = file.gets)
            f.print(line)
          end
        end
        f.print("\n")
        f.print(locales.to_s)
      end
    end
  end
end