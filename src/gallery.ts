/// <reference path="defs/jquery/jquery.d.ts"/>
/// <reference path="defs/handlebars/handlebars.d.ts"/>
import $ = require('jquery');
import handlebars = require('handlebars');
import modal = require('./modal');

export interface GalleryConfig {
  modal_selector:string;
  pagination_selector:string;
  group_template_selector:string;
  item_template_selector:string;
  items_per_page:number;
  api_url:string;
}

export class Gallery {

    config:GalleryConfig;
    compiled_item_template:any;
    compiled_group_template:any;
    $pagination:any;
    $container:any;
    category:any[];
    types:any[];
    modal:modal.Modal;

    constructor($container, overrides:GalleryConfig = null) {

        var config:GalleryConfig = {
          group_template_selector: "#gallery-group-template",
          item_template_selector: "#gallery-item-template",
          api_url: window.location.pathname + '/gallery.json',
          items_per_page: 1,
          pagination_selector: '.pagination',
          modal_selector: '.modal'
        };

        if (config) {
          for (var key in overrides) {
            config[key] = overrides[key];
          }
        }

        this.config = config;

        var item_template_source = $(config.item_template_selector).html();
        var group_template_source = $(config.group_template_selector).html();
        this.compiled_item_template = handlebars.compile(item_template_source);
        this.compiled_group_template = handlebars.compile(group_template_source);

        this.$pagination = $container.find(this.config.pagination_selector);
        this.$container = $container;

        this.category = [];
        this.types = [];

        this.modal = new modal.Modal($container.find(this.config.modal_selector), this);

        this.setupControls();
        this.update();
    }

    update() {
        var params:any = {};
        params.category = this.category;
        params.types = this.types;
        $.getJSON(this.config.api_url, params, (data) => {
            this.callback(data);
        });
    }

    setupControls(e = null) {
        var typeChangeCallback = () => {
            var types = [];
            $('.filter--types a.state-active').each(function () {
                types.push($(this).data('type'));
            });
            this.types = types;

            if (!types.length) {
                $('.filter--types a').addClass('state-active');
            }
        };

        var categoryChangeCallback = () => {
            this.category = $('.filter--category a.state-active').data('category') || null;
        };

        $('.filter--category a').click(function (e) {
            e.preventDefault();
            $('.filter--category a.state-active').removeClass('state-active');
            $(this).addClass('state-active');
            categoryChangeCallback();
            this.update();
        });
        categoryChangeCallback();

        $('.filter--types a').click(function (e) {
            e.preventDefault();
            $(this).toggleClass('state-active');
            typeChangeCallback();
            this.update();
        });
        typeChangeCallback();
    }

    callback(data) {

        // Cleanup
        $('.groups', this.$container).empty();
        this.$pagination.empty();

        // Append our new items
        var groups = ((items, size) => {
            var groups = [];
            if (items && items.length) {
                while (items.length > 0) {
                    groups.push(items.splice(0, size));
                }
                return groups;
            }
            return [];
        })(data.items, this.config.items_per_page);

        $.each(groups, (group_index, group) => {
            var data = '';
            $.each(group, (index, item:any) => {
                item.page = group_index + 1;
                var item_html = this.compiled_item_template(item);
                data += item_html;
            });

            var group_html = this.compiled_group_template({'data': data});
            $('.groups', this.$container).append(group_html);
        });

        // Setup pagination
        var pagination_click_callback = (e) => {
            var $target = $(e.target);
            var i = parseInt($target.closest('a').attr('data-i'));
            e.preventDefault();

            $(this.$container).find('.state-current').removeClass('state-current');
            $target.closest('a').parent().addClass('state-current');

            var group = this.$container.find('.group')[i - 1];
            $(group).addClass('state-current');
        }

        // Setup content
        var group_elements = this.$container.find('.group');
        $(group_elements[0]).first().addClass('state-current');
        for (var i = 1; i <= group_elements.length; i++) {
            var $page = $('<li>');
            var $page_link = $('<a href="#"><span class="visual-hide">Page </span>' + i + '</a>');
            if (i === 1) {
                $page.addClass('state-current');
            }
            $page_link.attr('data-i', i);
            $page_link.on('click', pagination_click_callback);
            $page.append($page_link);
            this.$pagination.append($page);
        }

        this.handleExpand();
    }

    setPage(i) {
        this.$pagination.find('a')[i - 1].click();
    }

    getPageGroup(i) {
        return this.$container.find('.group')[i - 1];
    }

    getCurrentPageNumber() {
        return parseInt(this.$pagination.find('.state-current a').data('i'), 10);
    }

    getTotalPages() {
        return this.$pagination.find('.state-current a').data('i');
    }

    handleExpand() {
        var that = this;
        var $modal = this.$container.find('.modal');
        $('a.expand', this.$container).click(function (e) {
            e.preventDefault();
            that.setActive($(this).parent());
        });
    }

    findPrevItem($el) {
        var $item = $el.prev('.gallery-item');
        var currentPageNumber = this.getCurrentPageNumber();
        if (!$item.length) {
            if (currentPageNumber > 1) {
                $item = $(this.getPageGroup(currentPageNumber - 1)).find('.gallery-item:last');
            }
        }
        return $item;
    }

    findNextItem($el) {
        var $item = $el.next('.gallery-item');
        var currentPageNumber = this.getCurrentPageNumber();
        if (!$item.length) {
            if (currentPageNumber < this.$container.find('.group').length) {
                $item = $(this.getPageGroup(currentPageNumber + 1)).find('.gallery-item:first');
            }
        }
        return $item;
    }

    setActive($el) {
        var hasprev;
        var hasnext;
        var $content = $el.find('.gallery-item-full').clone();
        var currentPageNumber = this.getCurrentPageNumber();

        // If the current page is not that of the element's, switch to that page
        if (currentPageNumber !== $el.data('page')) {
            this.setPage($el.data('page'));
        }
        // Run this after the page has been adjusted.
        hasprev = this.findPrevItem($el).length > 0;
        hasnext = this.findNextItem($el).length > 0;

        // Set the active gallery item
        this.$container.find('.gallery-item.state-active').removeClass('state-active');
        $el.addClass('state-active');

        // Swap out the enlarged media
        if ($el.data('type') === 'Image') {
            $content.find('.expanded-media').append('<img src="' + $el.data('image-large') + ' alt="' + $el.find('.expand img').attr('alt') + '">');
        }
        else {
            $content.find('.expanded-media').append('<iframe width="100%" height="400" src="//www.youtube.com/embed/' + $el.data('youtube-id') + '" frameborder="0" allowfullscreen="allowfullscreen"></iframe>');
        }

        // Update the modal dialog
        this.modal.setContent($content, hasprev, hasnext);
        this.modal.setHeading(($el.index() + 1) + ' of ' + this.$container.find('.gallery-item').length);
        this.modal.show();
    }

    handleNextPrev(direction) {
        var $activeEl = this.$container.find('.gallery-item.state-active');

        if (direction === 'next') {
            this.setActive(this.findNextItem($activeEl));
        }
        else {
            this.setActive(this.findPrevItem($activeEl));
        }
    }
}
