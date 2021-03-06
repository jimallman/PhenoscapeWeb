module SearchHelper
  
  @@IS_A = "OBO_REL:is_a"
  
  def truncate_list(list, length)
    if list.length <= length
      return list.join(", ")
    else
      list[0..(length - 1)].join(", ") + (" ...and %d more" % (list.length - length))
    end
  end
  
  #list is a sample of the total number given in length
  #length parameter of zero always just leaves off the "n more"
  def list_more(list, length)
    if list.empty?
      return nil
    elsif length > list.length
      return list.join(", ") + " and " + (length - list.length).to_s + " more"
    else
      return list.join(", ")
    end
  end
  
  # should this method sanitize input text before returning?
  def format_homologies(list)
    list.collect do |item|
      target = item["target"]
      entity_id = target["entity"]["id"]
      entity_name = target["entity"]["name"]
      taxon_id = target["taxon"]["id"]
      taxon_link = taxon_link(target["taxon"])
      %Q|<a href="/search/entity/#{entity_id}" title="#{entity_id}">#{entity_name}</a> in #{taxon_link} <a href="#" title="View Source" onclick="showSource('#{entity_id}', '#{taxon_id}', this); return false;"><img src="/images/page_text.gif"></a>|
		end
  end
  
  def lump_relations(list)
    relations = Hash.new {|hash, key| hash[key] = {"targets" => []}}
    for link in list
      entry = relations[link["relation"]["id"]]
      entry["relation"] = link["relation"]
      entry["targets"].push(link["target"])
    end
    for relation in relations.values
      relation["targets"].sort! {|x,y| x["name"] <=> y["name"]}
    end
    return relations.values.sort do |x,y|
      if x["relation"]["id"] == @@IS_A
        -1
      elsif y["relation"]["id"] == @@IS_A
        1
      else
        x["relation"]["name"] <=> y["relation"]["name"]
      end
    end
    end
    
  def filter_out_attribute(attribute, examples)
    return examples.find_all do |item|
      item["id"] != attribute["id"]
    end
  end
  
end
