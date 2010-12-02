module J18n
  class RegenerateGenerator < Rails::Generators::Base
    def generate
      J18n::Builder.build()
    end
  end
end