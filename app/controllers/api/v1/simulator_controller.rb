# frozen_string_literal: true

class Api::V1::SimulatorController < Api::V1::BaseController
  include SimulatorHelper
  include ActionView::Helpers::SanitizeHelper

  before_action :authenticate_user!, only: %i[update edit update_image]
  before_action :set_project, only: %i[show edit]
  before_action :check_view_access, only: %i[show]
  before_action :set_user_project, only: %i[update update_image]
  before_action :check_edit_access, only: %i[edit update update_image]
  skip_before_action :verify_authenticity_token, only: %i[show update]

  # Get api/v1/simulator/:id/edit
  def edit
    render json: Api::V1::UserSerializer.new(current_user)
  end

  # GET api/v1/simulator/:id
  def show
    @data = ProjectDatum.find_by(project: @project)
    if @data
      render json: @data.data, status: :ok
    else
      render json: { errors: "Data not found for the specified project." }, status: :not_found
    end
  end

  # POST api/v1/simulator/update
  def update
    @project.build_project_datum unless ProjectDatum.exists?(project_id: @project.id)
    @project.project_datum.data = sanitize_data(@project, params[:data])

    image_file = return_image_file(params[:image])

    @project.image_preview = image_file
    @project.name = sanitize(params[:name])

    if @project.save && @project.project_datum.save
      image_file.close
      File.delete(image_file) if check_to_delete(params[:image])

      render json: { status: "success", project: @project }, status: :ok
    else
      render json: { status: "error", errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

    def set_project
      @project = Project.friendly.find(params[:id])
    end

    # FIXME: remove this logic after fixing production data
    # def set_user_project
    #   @project = current_user.projects.friendly.find_by(id: params[:id]) || Project.friendly.find(params[:id])
    # end
    def set_user_project
      @project = current_user.projects.friendly.find(params[:id])
    end

    def check_edit_access
      authorize @project, :check_edit_access?
    end

    def check_view_access
      authorize @project, :check_view_access?
    end
end
