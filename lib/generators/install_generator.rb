module J18n
  class InstallGenerator < Rails::Generators::Base
    def copy_initializer
      plugin_path = File.join(File.dirname(__FILE__), "../templates/initializer.rb")
      rails_path = Rails.root.join('config/initializers/j18n.rb')
      copy_file(plugin_path, rails_path)
    end
  end
end