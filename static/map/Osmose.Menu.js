require('leaflet');
require('leaflet-sidebar');
require('leaflet-sidebar/src/L.Control.Sidebar.css');
var Cookies = require('js-cookie');

require('./Osmose.Menu.css');


export var OsmoseMenu = L.Control.Sidebar.extend({

  options: {
    closeButton: false,
    autoPan: false,
  },

  includes: L.Mixin.Events,

  initialize: function (placeholder, options) {
    this._$container = $("#" + placeholder);

    this._countItemAll();
    this._change_level();

    var self = this;
    $("div#tests input[type='checkbox']").change(function () {
      self._checkbox_click(this);
    });
    $(".toggleAllItem").click(function () {
      self._toggleAllItem(this);
      return false;
    });
    $(".invertAllItem").click(function () {
      self._invertAllItem();
      return false;
    });
    $(".toggleCateg").click(function () {
      self._toggleCateg(this);
      return false;
    });
    $("#level, #tags, #fixable").change(function () {
      self._change_level();
    });
    $("#togglemenu").click(function () {
      self.toggle();
      return false;
    });

    L.Control.Sidebar.prototype.initialize.call(this, placeholder, options);
  },

  // Menu
  toggle: function () {
    L.Control.Sidebar.prototype.toggle.call(this);
    if ($('.leaflet-active-area').css('left') == '0px') {
      $('.leaflet-active-area').css('left', '');
    } else {
      $('.leaflet-active-area').css('left', '0px');
    }
    this._itemChanged();
  },

  // Update checkbox count
  _countItem: function (test_group) {
    var count_checked = 0,
      count_tests = 0;
    $.each($("input[type='checkbox']", test_group), function (index, checkbox) {
      if ($(checkbox).is(':checked')) {
        count_checked++;
      }
      count_tests++;
    });
    $(".count", test_group).html(count_checked + '/' + count_tests);
  },

  _countItemAll: function () {
    var self = this;
    $(".test_group").each(function (i, group) {
      self._countItem(group);
    });
  },

  // Click on a checkbox
  _checkbox_click: function (cb) {
    this._countItem($(cb).closest(".test_group"));
    this._itemChanged();
  },

  // Show or hide a group of tests
  _toggleCateg: function (id) {
    var ul = $("ul", $(id).closest(".test_group"));
    if (ul.is(':visible')) {
      ul.slideUp(200);
      $(id).addClass('folded');
    } else {
      ul.slideDown(200);
      $(id).removeClass('folded');
    }
  },

  // Check or uncheck a categ of tests.
  _toggleAllItem: function (link) {
    var test_group = $(link).closest(".test_group, #myform"),
      checkbox = $((test_group.prop("tagName") != "FORM" ? "" : ".test_group:not(#categUnactiveItem) ") + "input[type='checkbox']", test_group);
    if ($(link).data().view == "all") {
      checkbox.prop('checked', true);
    } else {
      checkbox.prop('checked', false);
    }

    if (test_group.prop("tagName") == "FORM") {
      this._countItemAll(test_group);
    } else {
      this._countItem(test_group);
    }
    this._itemChanged();
  },

  // Invert item check
  _invertAllItem: function () {
    $("#myform .test_group:not(#categUnactiveItem) input[type='checkbox']").each(function () {
      $(this).prop('checked', !$(this).prop('checked'));
    });

    this._countItemAll();
    this._itemChanged();
  },

  // Change level
  _change_item_display: function (l, tag, fixable) {
    $("div#tests li").each(function () {
      var id = parseInt($(this).attr('id').replace(/item_desc/, ''), 10);
      if ($.inArray(id, item_levels[l]) >= 0 && (!(tag in item_tags) || $.inArray(id, item_tags[tag]) >= 0)) {
        $("#item_desc" + id).show();
      } else {
        $("#item_desc" + id).hide();
      }
    });
    var ll = l.split(',');
    for (var i = 1; i <= 3; i++) {
      if ($.inArray(i.toString(), ll) >= 0) {
        $(".level-" + i).removeClass("disabled");
      } else {
        $(".level-" + i).addClass("disabled");
      }
    }
  },

  _change_level: function change_level() {
    var new_level = document.myform.level.value,
      new_tag = document.myform.tags.value,
      fixable = document.myform.fixable.value;
    this._change_item_display(new_level || "1,2,3", new_tag, fixable);

    this._itemChanged();
  },

  _itemChanged: function (skipBuildUrl) {
    if (!skipBuildUrl) {
      this._urlPart = this._buildUrlPart();
    }
    this.fire('itemchanged', {
      urlPart: this._urlPart
    });
  },

  urlPart: function () {
    return this._urlPart;
  },

  _buildUrlPart: function () {
    // items list
    var ch = "";
    if ($(".test_group:not(#categUnactiveItem) :checkbox:not(:checked)").length == 0) {
      ch = "xxxx";
    } else {
      $(".test_group:not(#categUnactiveItem)").each(function () {
        var id = this.id,
          v = $("h1 span", this).text().split("/");
        if (v[0] == v[1]) {
          ch += id.substring(5, 6) + "xxx,";
        } else {
          $(":checked", this).each(function () {
            ch += this.name.substr(4) + ",";
          });
        }
      });
    }
    ch = ch.replace(/,$/, '');

    var cookies_options = {
      expires: 365,
      path: '/'
    }

    Cookies.set('last_level', document.myform.level.value, cookies_options);
    Cookies.set('last_item', ch, cookies_options);
    Cookies.set('last_tags', document.myform.tags.value, cookies_options);
    Cookies.set('last_fixable', document.myform.fixable.value, cookies_options);

    return {
      item: ch,
      level: document.myform.level.value,
      tags: document.myform.tags.value,
      fixable: document.myform.fixable.value,
    };
  },

  setItems: function (items, levels, tags, fixable) {
    if (items) {
      var checkbox = $(".test_group:not(#categUnactiveItem) :checkbox");
      checkbox.attr('checked', false).prop('checked', false);
      $.each(items.split(','), function (i, item) {
        item = new RegExp('item' + item.replace(/x/g, '.'));
        checkbox.filter(function () {
          return item.test(this.id);
        }).attr('checked', true).prop('checked', true);
      });
    }

    if (levels) {
      document.myform.level.value = levels;
    }

    if (tags != undefined) {
      document.myform.tags.value = tags;
    }

    if (fixable != undefined) {
      document.myform.fixable.value = fixable;
    }

    this._countItemAll();
    this._urlPart = {};
    if (items) {
        this._urlPart.item =  items;
    }
    if (levels) {
      this._urlPart.level = levels;
    }
    if (tags) {
      this._urlPart.tags = tags;
    }
    if (fixable) {
      this._urlPart.fixable = fixable;
    };
    this._itemChanged(true);
  },
});


export var OsmoseMenuToggle = L.Control.extend({

  options: {
    position: 'topleft',
    menuText: '',
    menuTitle: 'Menu'
  },

  initialize: function (menu, options) {
    L.Control.prototype.initialize.call(this, options);
    this._menu = menu;
  },


  onAdd: function (map) {
    var menuName = 'leaflet-control-menu-toggle',
      container = L.DomUtil.create('div', menuName + ' leaflet-bar');
    this._map = map;
    this._zoomInButton = this._createButton(this.options.menuText, this.options.menuTitle, menuName + '-in', container, this._menuToggle, this);
    return container;
  },

  _menuToggle: function () {
    this._menu.toggle();
  },

  _createButton: function (html, title, className, container, fn, context) {
    var link = L.DomUtil.create('a', className, container);
    link.style = 'background-image: url(/images/menu.png)'; // Firefox
    link.style['background-image'] = 'url(/images/menu.png)'; // Chrome
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    var stop = L.DomEvent.stopPropagation;

    L.DomEvent
      .on(link, 'click', stop)
      .on(link, 'mousedown', stop)
      .on(link, 'dblclick', stop)
      .on(link, 'click', L.DomEvent.preventDefault)
      .on(link, 'click', fn, context)
      .on(link, 'click', this._refocusOnMap, context);

    return link;
  },
});
