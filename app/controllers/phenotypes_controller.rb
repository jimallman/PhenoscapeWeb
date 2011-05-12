class PhenotypesController < ApplicationController
  
  before_filter :filter_term_names, :only => :index
  # cache including query parameters
  caches_action :index, :cache_path => Proc.new { |controller| controller.params }
  caches_action :facets, :cache_path => Proc.new { |controller| controller.params }
  
  def index
    @phenotypes = Phenotype.find(query_params)
  end
  
  
  def facets
    setup_facet_counts
    @phenotypes = Phenotype.find(query_params)
  end
  
  
  def download
    download_query_results(Phenotype, query_params)
  end
  
  
  private
  
  
    def query_params
      sections = [:taxa, :genes]
      sections << :publications unless action_name == 'facets'
      setup_query_params('entity', sections, :any_or_all_sections => sections, :inferred => false)
    end
    
    
    def setup_facet_counts
      params[:facet_paths] ||= {}
      params[:filter] ||= {}
      params[:filter][:phenotypes] = {'0' => {}}
      params[:filter][:taxa] = nil
      params[:filter][:genes] = nil
      @selected_term_ids = {}
      [:entity, :quality, :related_entity, :taxon, :gene].each do |term_type|
        term_ids = params[:facet_paths][term_type].present? ? params[:facet_paths][term_type].split(',') : []
        selected_term_id = term_ids.any? ? term_ids.last : nil
        @selected_term_ids[term_type] = selected_term_id
        
        #setup params[:filter] for phenotypes query based on params[:*_path] vars  
        if selected_term_id
          if [:entity, :quality, :related_entity].include?(term_type)
            params[:filter][:phenotypes]['0'][term_type] = selected_term_id
          else
            params[:filter][term_type] = [selected_term_id]
          end
        end
      end
      if params[:filter][:phenotypes]['0'].empty?
        params[:filter][:phenotypes] = nil
      else
        params[:filter][:phenotypes]['0'][:including_parts] = (params[:facet_paths][:part_of].to_s == 'true')
      end
      
      [:entity, :quality, :related_entity, :taxon, :gene].each do |term_type|
        facet_options = {:path => params[:facet_paths][term_type]}
        facet_options[:part_of] = (params[:facet_paths][:part_of].to_s == 'true')
        [:entity, :quality, :related_entity, :taxon, :gene].each{|tt| facet_options[tt] = @selected_term_ids[tt] }
        results = Phenotype.facet_counts(term_type, facet_options)
        instance_variable_set("@#{term_type}_facets", results)
      end
      
      filter_term_names
    end
    
end
