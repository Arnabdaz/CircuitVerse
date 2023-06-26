# app/controllers/vuesimulator_controller.rb
# frozen_string_literal: true

class VuesimulatorController < ApplicationController
  def simulatorvue
    html = File.read(Rails.root.join("public/simulatorvue/index.html"))
    # sanitized_html = sanitize(html)
    render html: html.html_safe, layout: false
  end

  # private

  #   def sanitize(html)
  #     ActionController::Base.helpers.sanitize(html)
  #   end
end
