/* This script was compiled from CoffeeScript. Do not edit this file directly, or the changes will be overwritten next time the coffee script is compiled. */
(function() {
  var $, Phenotype, ProfileTree, ProfileTreeNode, StateTransition, Tree, TreeNode, VariationTree, VariationTreeNode;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  $ = jQuery;
  Tree = (function() {
    function Tree(container_id) {
      this.container_id = container_id;
      $(__bind(function() {
        var container, current_label_content, initial_page_load, term_info_div;
        container = $("#" + this.container_id);
        container.css('visibility', 'hidden');
        this.options || (this.options = {});
        this.options.loading_background_color = "#DDE9EE";
        term_info_div = $('#term_info');
        initial_page_load = true;
        current_label_content = function() {
          return {
            'current_entity_name': $("#current_entity_name").html(),
            'quality_name': $(".quality_name").html()
          };
        };
        this.initial_from_data = $('#query_form').serialize();
        term_info_div.change(__bind(function() {
          var new_state, path, popstate_callback, state, _ref;
          if ((_ref = this.spacetree) != null ? _ref.busy : void 0) {
            return setTimeout(__bind(function() {
              return term_info_div.change();
            }, this), 10);
          }
          new_state = false;
          if (!term_info_div.data('restoring_state')) {
            path = this.current_state_path();
            state = {
              form_data: $('#query_form').serialize(),
              labels: current_label_content()
            };
            popstate_callback = __bind(function(event) {
              var form_data, html, label, labels, _ref2;
              term_info_div.data('restoring_state', true);
              if ((state = (_ref2 = event.originalEvent) != null ? _ref2.state : void 0)) {
                form_data = state.form_data || this.initial_from_data;
                labels = state.labels || this.initial_label_content;
                $('#query_form').unserializeForm(form_data);
                for (label in labels) {
                  html = labels[label];
                  $("#" + label + ",." + label).html(html);
                }
              }
              return term_info_div.change();
            }, this);
            if (!initial_page_load) {
              new_state = new StateTransition(path, state, popstate_callback);
            }
          } else {
            term_info_div.data('restoring_state', false);
          }
          if (new_state.redirecting) {
            return this.show_loading();
          } else {
            this.destroy_spacetree();
            this.create_spacetree();
            this.query();
            return this.check_empty_state();
          }
        }, this));
        term_info_div.change();
        return initial_page_load = false;
      }, this));
    }
    Tree.prototype.create_spacetree = function(jit_options) {
      var jit_default_options, _ref;
      $('#tree_empty_state').hide();
      this.root_node || (this.root_node = this.options.tree_node_class.create_root(this));
      jit_default_options = {
        injectInto: this.container_id,
        duration: 300,
        transition: $jit.Trans.Quart.easeOut,
        levelDistance: 100,
        levelsToShow: 1,
        Node: {
          autoHeight: true,
          autoWidth: true,
          type: 'rectangle',
          overridable: true
        },
        Edge: {
          type: 'bezier',
          overridable: true
        }
      };
      $.extend(jit_default_options, jit_options);
      jit_options = jit_default_options;
      $jit.ST.Label.HTML.prototype.fitsInCanvas = function() {
        return true;
      };
      return (_ref = this.spacetree) != null ? _ref : this.spacetree = new $jit.ST(jit_options);
    };
    Tree.prototype.destroy_spacetree = function() {
      this.root_node = null;
      try {
        if (this.spacetree != null) {
          return this.spacetree.removeSubtree(this.spacetree.root, true, 'replot');
        }
      } catch (err) {

      }
    };
    Tree.prototype.initialize_spacetree = function() {
      if (this.root_node.children.length === 1) {
        this.root_node = this.root_node.children[0];
        this.root_node.data.is_root = true;
      }
      this.spacetree.loadJSON(this.root_node);
      this.spacetree.compute();
      this.spacetree.plot();
      if (!this.spacetree.graph.getNode(this.spacetree.root).data.leaf_node) {
        return this.spacetree.onClick(this.spacetree.root);
      }
    };
    Tree.prototype.center_canvas = function(options) {
      return this.spacetree.canvas.translate(-this.spacetree.canvas.translateOffsetX, -this.spacetree.canvas.translateOffsetY);
    };
    Tree.prototype.load_selected_terms = function() {
      return this.term_params = $("form#query_form}}").serialize();
    };
    Tree.prototype.query = function(taxon_id) {
      var loading_root, url;
      if (taxon_id == null) {
        taxon_id = null;
      }
      this.load_selected_terms();
      if (!(this.term_count > 0)) {
        return;
      }
      this.show_loading();
      loading_root = !(taxon_id != null);
      url = "" + this.options.base_path + "?" + (decodeURIComponent(this.term_params));
      if (!loading_root) {
        url += "&taxon=" + taxon_id;
      }
      this.sequence = (this.sequence || 0) + 1;
      return $.ajax({
        url: url,
        type: 'get',
        dataType: 'script',
        data: {
          sequence: this.sequence,
          levels: loading_root ? 2 : 1,
          authenticitiy_token: AUTH_TOKEN
        },
        success: __bind(function() {
          return this.hide_error();
        }, this),
        error: __bind(function() {
          return this.ajax_error_handler();
        }, this)
      });
    };
    Tree.prototype.query_callback = function(sequence, root_node, empty_resultset) {
      if (empty_resultset == null) {
        empty_resultset = false;
      }
      if (sequence !== this.sequence) {
        return;
      }
      this.hide_loading();
      if (root_node.data.is_root) {
        if (!empty_resultset) {
          root_node.name || (root_node.name = 'Phenotype query');
          root_node.data.leaf_node = false;
          root_node.set_color();
        } else {
          root_node.name = 'No results';
          root_node.data.leaf_node = true;
          root_node.set_color();
        }
        return this.initialize_spacetree();
      } else {
        return this.update_spacetree(root_node);
      }
    };
    Tree.prototype.show_loading = function() {
      var opts, self, _ref;
      this.loading = true;
      opts = {
        lines: 12,
        length: 30,
        width: 11,
        radius: 30,
        color: "#FFF",
        speed: 1,
        trail: 60,
        shadow: false
      };
      if ((_ref = this.loading_spinner) == null) {
        this.loading_spinner = new Spinner(opts).spin(document.getElementById("" + this.container_id + "-loading"));
      }
      self = this;
      $("#" + this.container_id).animate({
        backgroundColor: self.options.loading_background_color
      }, {
        duration: 'fast',
        queue: true
      });
      return $("#" + this.container_id + "-loading").show();
    };
    Tree.prototype.hide_loading = function() {
      this.loading = false;
      return $("#" + this.container_id).animate({
        backgroundColor: '#FFFFFF'
      }, {
        duration: 'fast',
        queue: true,
        complete: __bind(function() {
          if (!this.loading) {
            return $("#" + this.container_id + "-loading").hide();
          }
        }, this)
      });
    };
    Tree.prototype.ajax_error_handler = function(jqXHR, textStatus, errorThrown) {
      return $("#" + this.container_id).prepend($('<div class="error rounded-small visualize-area">An error occurred. You might reload the page and try again.</div>'));
    };
    Tree.prototype.hide_error = function() {
      return $("#" + this.container_id + " .error").remove();
    };
    Tree.prototype.find_node = function(id) {
      var result_node, search_nodes;
      if (!((id != null) && id.length > 0)) {
        return null;
      }
      search_nodes = [this.root_node];
      while (search_nodes.any()) {
        result_node = search_nodes.find(function(node) {
          return node.id === id;
        });
        if (result_node != null) {
          return result_node;
        }
        search_nodes = search_nodes.map(function(node) {
          return node.children;
        });
        search_nodes = search_nodes.flatten();
      }
      return null;
    };
    Tree.prototype.check_empty_state = function() {
      var empty_state_div, tree_div;
      tree_div = $("#" + this.container_id);
      empty_state_div = $("#" + this.container_id + "-empty");
      if (this.term_count && this.term_count > 0) {
        empty_state_div.hide();
        return tree_div.css('visibility', 'visible');
      } else {
        tree_div.css('visibility', 'hidden');
        return empty_state_div.show();
      }
    };
    return Tree;
  })();
  ProfileTree = (function() {
    __extends(ProfileTree, Tree);
    function ProfileTree(container_id) {
      this.container_id = container_id;
      this.options = {
        tree_node_class: ProfileTreeNode,
        base_path: '/phenotypes/profile_tree'
      };
      ProfileTree.__super__.constructor.call(this, this.container_id);
    }
    ProfileTree.prototype.create_spacetree = function() {
      return ProfileTree.__super__.create_spacetree.call(this, {
        Navigation: {
          enable: true,
          panning: true
        },
        request: __bind(function(nodeId, level, onComplete) {
          this.update_spacetree_callback = onComplete.onComplete;
          return this.query(nodeId);
        }, this),
        onCreateLabel: __bind(function(label, node) {
          label = $(label);
          label.attr('id', node.id);
          label.html(node.name);
          if (!node.data.leaf_node) {
            label.click(__bind(function() {
              this.center_canvas();
              return window.profile_tree.spacetree.onClick(node.id);
            }, this));
          }
          return label.css({
            cursor: 'pointer',
            color: '#333',
            fontSize: '0.8em',
            padding: '3px',
            'white-space': 'nowrap'
          });
        }, this)
      });
    };
    ProfileTree.prototype.update_spacetree = function(node) {
      if (!this.update_spacetree_callback) {
        throw "$jit failed to set update_spacetree_callback";
      }
      return this.update_spacetree_callback(node.id, node);
    };
    ProfileTree.prototype.load_selected_terms = function() {
      ProfileTree.__super__.load_selected_terms.call(this);
      return this.term_count = $("#term_info .phenotype").length;
    };
    ProfileTree.prototype.query_callback = function(sequence, matches, root_taxon_id) {
      var empty_resultset, match, match_child, node, root_node, _i, _j, _len, _len2, _ref;
      if (sequence !== this.sequence) {
        return;
      }
      root_node = this.find_node(root_taxon_id) || this.root_node;
      matches = matches.sortBy(function(m) {
        return m.name;
      });
      for (_i = 0, _len = matches.length; _i < _len; _i++) {
        match = matches[_i];
        node = root_node.find_or_create_child(this, match.taxon_id, match.name, {
          greatest_profile_match: match.greatest_profile_match
        });
        if (match.matches != null) {
          match.matches = match.matches.sortBy(function(m) {
            return m.name;
          });
          _ref = match.matches;
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            match_child = _ref[_j];
            node.find_or_create_child(this, match_child.taxon_id, match_child.name, {
              greatest_profile_match: match_child.greatest_profile_match
            });
          }
        }
      }
      empty_resultset = matches.length === 0;
      return ProfileTree.__super__.query_callback.call(this, sequence, root_node, empty_resultset);
    };
    ProfileTree.prototype.current_state_path = function() {
      return this.options.base_path + "?" + $('form[name=complex_query_form]').serialize();
    };
    return ProfileTree;
  })();
  VariationTree = (function() {
    __extends(VariationTree, Tree);
    function VariationTree(container_id) {
      this.container_id = container_id;
      this.options = {
        tree_node_class: VariationTreeNode,
        base_path: '/phenotypes/variation_tree',
        max_taxa_shown_in_group: 20
      };
      this.current_entity_id = window.location.pathname.sub(/.*\//, '');
      $(function() {
        var update_quality_name;
        update_quality_name = function() {
          return $('.quality_name').html($('#quality_select option:selected').html());
        };
        $('#quality_select').change(function() {
          update_quality_name();
          return $('#term_info').change();
        });
        return update_quality_name();
      });
      VariationTree.__super__.constructor.call(this, this.container_id);
      $(function() {
        var associated_targets, dont_propagate;
        associated_targets = function(hovered) {
          var associated, target, targets, _i, _len;
          targets = $(hovered);
          associated = targets.data('associated');
          if (associated) {
            for (_i = 0, _len = associated.length; _i < _len; _i++) {
              target = associated[_i];
              targets = targets.add($(document.getElementById(target)));
            }
          }
          return targets;
        };
        $(".node-group-with-phenotypes,#variation-table tbody tr:not(.empty)").live({
          'mouseover': function() {
            return associated_targets(this).each(function() {
              var associated;
              associated = $(this);
              associated.data('classes', associated.attr('class'));
              return associated.addClass('selected');
            });
          },
          'mouseout': function() {
            return associated_targets(this).each(function() {
              var associated, classes;
              associated = $(this);
              classes = associated.data('classes');
              if (classes) {
                return associated.attr('class', classes);
              }
            });
          },
          'click': function() {
            var a_t, others;
            a_t = associated_targets(this);
            if ($(this).data('sticky')) {
              a_t.data('sticky', null);
              $('.selected').removeClass('selected');
            } else {
              a_t.addClass('selected');
              a_t.data('sticky', true);
            }
            a_t.each(function() {
              var associated;
              associated = $(this);
              return associated.data('classes', null);
            });
            others = $('.selected').not(a_t);
            others.removeClass('selected');
            return others.data('sticky', null);
          }
        });
        dont_propagate = function(event) {
          return event.stopPropagation();
        };
        return $('.node-group-with-phenotypes .node-taxon').live({
          'mouseover': dont_propagate,
          'mouseout': dont_propagate,
          'click': dont_propagate
        });
      });
    }
    VariationTree.prototype.create_spacetree = function() {
      VariationTree.__super__.create_spacetree.call(this, {
        Edge: {
          color: '#000',
          type: 'bezier',
          overridable: true
        },
        Node: {
          height: 1,
          width: 130,
          type: 'rectangle',
          overridable: true,
          levelDistance: 500
        },
        Label: {
          type: 'HTML'
        },
        Navigation: {
          enable: true,
          panning: 'avoid nodes'
        },
        onCreateLabel: __bind(function(label, node) {
          return this.create_label(label, node);
        }, this)
      });
      return this.load_suggested_taxa();
    };
    VariationTree.prototype.destroy_spacetree = function() {
      $('#variation-table').hide().find('tbody').empty();
      return VariationTree.__super__.destroy_spacetree.apply(this, arguments);
    };
    VariationTree.prototype.load_selected_terms = function() {
      VariationTree.__super__.load_selected_terms.call(this);
      return this.term_count = 1;
    };
    VariationTree.prototype.initialize_spacetree = function() {
      var id, node, _ref;
      _ref = this.spacetree.graph.nodes;
      for (id in _ref) {
        node = _ref[id];
        node.data.$height = $("#" + id).outerHeight();
        node.data.$width = $("#" + id).outerWidth();
      }
      return VariationTree.__super__.initialize_spacetree.call(this);
    };
    VariationTree.prototype.update_spacetree = function(subtree) {
      this.spacetree.addSubtree(subtree, 'replot');
      return VariationTreeNode.click_node_when_ready(this, subtree.id);
    };
    VariationTree.prototype.load_suggested_taxa = function(attempt) {
      var opts, url;
      if (attempt == null) {
        attempt = 0;
      }
      if (attempt > 1) {
        return $('#suggested-taxa').html('Failed to load suggested taxa');
      }
      if (attempt === 0) {
        opts = {
          lines: 10,
          length: 4,
          width: 3,
          radius: 5,
          color: "#000",
          speed: 2,
          trail: 60,
          shadow: false
        };
        new Spinner(opts).spin(document.getElementById('suggested-taxa'));
      }
      url = window.location.href.replace(/\/variation_tree\//, '/variation_tree_suggested_taxa/');
      return $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        data: {
          authenticitiy_token: AUTH_TOKEN
        },
        error: __bind(function() {
          return this.load_suggested_taxa(attempt + 1);
        }, this),
        success: function(data) {
          var suggested_taxa;
          suggested_taxa = $('#suggested-taxa');
          suggested_taxa.html('');
          return data.taxa.sortBy(function(taxon) {
            return taxon.name;
          }).each(function(taxon) {
            var link;
            link = $("<a href='#' class='suggested-taxon'>" + taxon.name + "</a>");
            link.click(function(event) {
              event.preventDefault();
              $('#term_id').val(taxon.id);
              return $('#term_filter_form').submit();
            });
            return link.appendTo(suggested_taxa);
          });
        }
      });
    };
    VariationTree.prototype.query_callback = function(sequence, phenotype_sets, root_taxon_id, taxon_data) {
      var root_node;
      if (sequence !== this.sequence) {
        return;
      }
      if (this.spacetree.busy) {
        return setTimeout(__bind(function() {
          return self.query_callback.call(this, sequence, phenotype_sets, root_taxon_id, taxon_data);
        }, this), 10);
      }
      this.change_taxon(root_taxon_id, taxon_data[root_taxon_id].name);
      root_node = this.build_tree(phenotype_sets, root_taxon_id, taxon_data);
      this.populate_phenotype_table(phenotype_sets);
      return VariationTree.__super__.query_callback.call(this, sequence, root_node);
    };
    VariationTree.prototype.build_tree = function(phenotype_sets, root_taxon_id, taxon_data) {
      var current_taxon_node, root_node, _ref;
      root_node = current_taxon_node = this.find_node(root_taxon_id);
      root_node || (root_node = this.root_node);
      current_taxon_node || (current_taxon_node = root_node.find_or_create_child(this, root_taxon_id, taxon_data[root_taxon_id].name, {
        type: 'taxon',
        rank: (_ref = taxon_data[root_taxon_id].rank) != null ? _ref.name : void 0,
        current: true
      }));
      current_taxon_node.estimateRenderHeight();
      phenotype_sets.each(__bind(function(group) {
        var group_id, node;
        group_id = "group-" + (hex_md5(JSON.encode(group)));
        group.group_id = group_id;
        node = current_taxon_node.find_or_create_child(this, group_id, group_id, {
          type: 'group',
          phenotypes: group.phenotypes,
          taxa: group.taxa.map(function(taxon_id) {
            var _ref2;
            return {
              id: taxon_id,
              name: taxon_data[taxon_id].name,
              rank: (_ref2 = taxon_data[taxon_id].rank) != null ? _ref2.name : void 0
            };
          })
        });
        return node.estimateRenderHeight();
      }, this));
      return root_node;
    };
    VariationTree.prototype.populate_phenotype_table = function(phenotype_sets) {
      var body, identifier, phenotype, phenotypes, row, table;
      table = $('#variation-table');
      phenotypes = Phenotype.group_sets_by_phenotype(phenotype_sets);
      body = table.find('tbody');
      body.html('');
      for (identifier in phenotypes) {
        phenotype = phenotypes[identifier];
        row = $("<tr id='" + identifier + "' class='phenotype-row'><td>" + phenotype.display_name + "</td><td>" + phenotype.taxon_count + "</td><td>" + phenotype.groups.length + "</td></tr>");
        row.appendTo(body);
        row.data('associated', phenotype.groups);
      }
      if (body.html() === '') {
        body.html('<tr class="empty"><td colspan="3">(none)</td></tr>');
      }
      return table.show();
    };
    VariationTree.prototype.create_label = function(label, node) {
      var phenotype, taxon_select_container, taxon_selector;
      label = $(label);
      label.attr('id', node.id);
      label.addClass('node');
      if (node.data.type === 'group') {
        label.addClass('node-group');
        node.data.taxa = node.data.taxa.sortBy(function(taxon) {
          return taxon.name;
        });
        if (node.data.taxa.length <= this.options.max_taxa_shown_in_group) {
          node.data.taxa.each(__bind(function(taxon) {
            var grouped_taxon;
            grouped_taxon = $("<div class='node-taxon " + taxon.rank + "' rel='" + taxon.id + "'>" + taxon.name + "</div>");
            grouped_taxon.appendTo(label);
            return grouped_taxon.click(__bind(function(event) {
              return VariationTreeNode.on_click(event, this, node, taxon);
            }, this));
          }, this));
        } else {
          taxon_select_container = $("<div class='node-taxon summary'></div>");
          taxon_selector = $("<select><option>" + node.data.taxa.length + " taxa</option></select>");
          node.data.taxa.each(__bind(function(taxon) {
            var taxon_option;
            taxon_option = $("<option>" + taxon.name + "</option>'");
            taxon_option.data('taxon', taxon);
            return taxon_option.appendTo(taxon_selector);
          }, this));
          setTimeout(__bind(function() {
            return taxon_selector.chosen().change(__bind(function(event) {
              var taxon;
              taxon = $(event.target).find('option:selected').data('taxon');
              return VariationTreeNode.on_click(event, this, node, taxon);
            }, this));
          }, this), 0);
          taxon_selector.appendTo(taxon_select_container);
          taxon_select_container.appendTo(label);
        }
        if (node.data.phenotypes.length === 0) {
          return label.addClass('node-group-without-phenotypes');
        } else {
          label.addClass('node-group-with-phenotypes');
          return label.data('associated', (function() {
            var _i, _len, _ref, _results;
            _ref = node.data.phenotypes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              phenotype = _ref[_i];
              _results.push(new Phenotype(phenotype).identifier());
            }
            return _results;
          })());
        }
      } else {
        label.addClass('node-taxon');
        label.addClass(node.data.rank);
        label.html(node.name);
        label.click(__bind(function(event) {
          return VariationTreeNode.on_click(event, this, node, {
            id: node.id,
            name: node.name,
            rank: node.data.rank
          });
        }, this));
        if (node.data.current) {
          return label.addClass('current');
        }
      }
    };
    VariationTree.prototype.current_state_path = function() {
      var base, phenotype_filter, taxon;
      base = this.options.base_path;
      taxon = "/" + this.current_entity_id;
      phenotype_filter = "?" + $('form[name=complex_query_form]').serialize();
      return base + taxon + phenotype_filter;
    };
    VariationTree.prototype.change_taxon = function(taxon_id, taxon_name) {
      $('#current_taxon_id').val(taxon_id);
      return $('#current_taxon_name').html(taxon_name);
    };
    VariationTree.prototype.navigate_to_taxon = function(taxon_id, taxon_name) {
      this.change_taxon(taxon_id, taxon_name);
      return $('#term_info').change();
    };
    VariationTree.prototype.navigate_to_entity = function(entity_id, entity_name) {
      this.current_entity_id = entity_id;
      $('#current_entity_id').val(entity_id);
      $('#current_entity_name').html(entity_name);
      return this.navigate_to_taxon();
    };
    return VariationTree;
  })();
  TreeNode = (function() {
    function TreeNode(tree, id, name, data, children) {
      this.tree = tree;
      this.id = id;
      this.name = name;
      this.data = data != null ? data : {};
      this.children = children != null ? children : [];
      if (!this.data.$color) {
        this.set_color();
      }
      if (!this.name) {
        this.name = this.id;
      }
    }
    TreeNode.prototype.set_color = function() {
      return this.data.$color = this.color();
    };
    TreeNode.prototype.find_or_create_child = function(tree, id, name, data) {
      var child;
      if (data == null) {
        data = {};
      }
      child = this.children.find(function(c) {
        return c.id === id;
      });
      if (child != null) {
        return child;
      }
      child = new this.constructor(tree, id, name, data);
      this.children.push(child);
      return child;
    };
    TreeNode.create_root = function(tree) {
      return new this(tree, 'root', 'root', {
        is_root: true
      });
    };
    return TreeNode;
  })();
  ProfileTreeNode = (function() {
    __extends(ProfileTreeNode, TreeNode);
    function ProfileTreeNode() {
      ProfileTreeNode.__super__.constructor.apply(this, arguments);
    }
    ProfileTreeNode.prototype.color = function() {
      var percentage;
      percentage = this.data.greatest_profile_match / this.tree.term_count;
      if (percentage < .50 || this.data.leaf_node) {
        return '#D3D3D3';
      } else if (percentage < .75) {
        return 'yellow';
      } else if (percentage < 1) {
        return 'orange';
      } else {
        return '#F44';
      }
    };
    return ProfileTreeNode;
  })();
  VariationTreeNode = (function() {
    __extends(VariationTreeNode, TreeNode);
    function VariationTreeNode() {
      VariationTreeNode.__super__.constructor.apply(this, arguments);
    }
    VariationTreeNode.prototype.color = function() {
      return 'transparent';
    };
    VariationTreeNode.prototype.estimateRenderHeight = function() {
      var effective_taxon_count, height, summarize, _ref;
      effective_taxon_count = (_ref = this.data.taxa) != null ? _ref.length : void 0;
      if (!effective_taxon_count) {
        effective_taxon_count = 1;
      }
      summarize = effective_taxon_count > this.tree.options.max_taxa_shown_in_group;
      if (summarize) {
        effective_taxon_count = 1;
      }
      height = 30 * effective_taxon_count;
      if (summarize) {
        height += 10;
      }
      if (this.data.type === "group") {
        height += 13 * 2;
      }
      return this.data.$height = height;
    };
    VariationTreeNode.on_click = function(event, tree, node, taxon) {
      var child, old_current_id, subtree, subtree_id, target;
      event.preventDefault();
      target = $(event.target);
      tree.center_canvas();
      if (target.hasClass('current' || tree.spacetree.busy)) {
        return;
      }
      tree.change_taxon(taxon.id, taxon.name);
      $('#clear-limit-tree-to').show();
      tree.query(taxon.id);
      old_current_id = $('.node.current').removeClass('current').attr('id');
      if (!old_current_id) {
        throw "No node is selected as current";
      }
      if (node.data.type === 'group') {
        tree.spacetree.removeSubtree(old_current_id, false, 'replot');
        subtree = tree.find_node(old_current_id);
        subtree.children = [];
        child = subtree.find_or_create_child(tree, taxon.id, taxon.name, {
          rank: taxon.rank
        });
        child.estimateRenderHeight();
        tree.spacetree.addSubtree(subtree, 'replot');
        target = $(document.getElementById(taxon.id));
      } else {
        subtree_id = target.attr('id');
        tree.spacetree.clickedNode = tree.spacetree.graph.getNode(subtree_id);
        tree.spacetree.removeSubtree(subtree_id, false, 'replot');
        tree.find_node(subtree_id).children = [];
      }
      return target.addClass('current');
    };
    VariationTreeNode.click_node_when_ready = function(tree, id) {
      if (!tree.spacetree.busy) {
        return tree.spacetree.onClick(id);
      } else {
        return setTimeout(function() {
          return VariationTreeNode.click_node_when_ready(tree, id);
        }, 50);
      }
    };
    return VariationTreeNode;
  })();
  StateTransition = (function() {
    function StateTransition(path, state, popstate_callback) {
      this.path = path;
      this.state = state;
      this.popstate_callback = popstate_callback;
      if (this.pushstate_supported) {
        this.push_state();
        this.set_popstate();
      } else {
        this.redirect();
      }
    }
    StateTransition.prototype.pushstate_supported = !!history.pushState;
    StateTransition.prototype.push_state = function() {
      return history.pushState(this.state, '', this.path);
    };
    StateTransition.prototype.redirect = function() {
      return window.location = this.path;
    };
    StateTransition.prototype.redirecting = !history.pushState;
    StateTransition.prototype.set_popstate = function() {
      var w;
      w = $(window);
      w.unbind('popstate');
      return w.bind('popstate', this.popstate_callback);
    };
    return StateTransition;
  })();
  Phenotype = (function() {
    function Phenotype(phenotype) {
      this.phenotype = phenotype;
    }
    Phenotype.prototype.identifier = function() {
      return "e=" + this.phenotype.entity.id + ";q=" + this.phenotype.quality.id;
    };
    Phenotype.prototype.display_name = function() {
      return "" + this.phenotype.entity.name + " " + this.phenotype.quality.name;
    };
    Phenotype.group_sets_by_phenotype = function(phenotype_sets) {
      var group, identifier, p, phenotype, phenotypes, _i, _j, _len, _len2, _ref;
      phenotypes = {};
      for (_i = 0, _len = phenotype_sets.length; _i < _len; _i++) {
        group = phenotype_sets[_i];
        _ref = group.phenotypes;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          phenotype = _ref[_j];
          p = new Phenotype(phenotype);
          identifier = p.identifier();
          if (phenotypes[identifier]) {
            phenotypes[identifier].groups.push(group.group_id);
            phenotypes[identifier].taxon_count += group.taxa.length;
          } else {
            phenotypes[identifier] = {
              phenotype: phenotype,
              groups: [group.group_id],
              taxon_count: group.taxa.length,
              display_name: p.display_name()
            };
          }
        }
      }
      return phenotypes;
    };
    return Phenotype;
  })();
  $(function() {
    if ($('#profile-tree').length > 0) {
      window.profile_tree = new ProfileTree('profile-tree');
    }
    if ($('#variation-tree').length > 0) {
      return window.variation_tree = new VariationTree('variation-tree');
    }
  });
}).call(this);
