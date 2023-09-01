# spec/controllers/static_controller_spec.rb

require 'rails_helper'

RSpec.describe StaticController, type: :controller do
  describe "GET #simulatorvue" do
    it "renders the simulatorvue template" do
      get :simulatorvue

      expect(response).to have_http_status(:success)
      expect(response).to render_template(file: Rails.root.join('public', 'simulatorvue', 'index.html'))
    end
  end
end
