/// <reference path="defs/jquery/jquery.d.ts"/>
/// <reference path="defs/handlebars/handlebars.d.ts"/>
import $ = require('jquery');
import handlebars = require('handlebars');

export class Modal {

    $el:any;
    gallery:Gallery;

    constructor(gallery:Gallery, $el) {
        this.$el = $el;
        this.gallery = gallery;
        this.init();
    }

    init(e:any = null) {
        this.$el.find('#close').click((e) => {
            e.preventDefault();
            this.hide();
        });
        this.$el.find('#next,#previous').click((e) => {
            var direction = $(this).attr('id');
            e.preventDefault();
            this.gallery.handleNextPrev(direction);
        });
    }

    show(e:any = null) {
        this.$el.addClass('state-active');
    }

    hide(e:any = null) {
        this.$el.removeClass('state-active');
    }

    setContent(content, hasprev, hasnext) {
        this.$el.find('#content').html(content);

        if (hasprev) {
            this.$el.find('#previous').show();
        }
        else {
            this.$el.find('#previous').hide();
        }

        if (hasnext) {
            this.$el.find('#next').show();
        }
        else {
            this.$el.find('#next').hide();
        }
    }

    setHeading(heading) {
        this.$el.find('#heading').text(heading);
    }
}

export class Gallery {

    api_url:string;
    items_per_page:number;
    group_template:any;
    item_template:any;
    item_template_source:any;
    compiled_item_template:any;
    group_template_source:any;
    compiled_group_template:any;
    $pagination:any;
    $container:any;
    category:any[];
    types:any[];
    modal:Modal;

    constructor($container) {
        this.api_url = window.location.pathname + '/gallery.json';
        this.items_per_page = 1;
        this.group_template = 'gallery-group-template';
        this.item_template = 'gallery-item-template';

        this.item_template_source = $('#' + this.item_template).html();
        this.compiled_item_template = handlebars.compile(this.item_template_source);
        this.group_template_source = $('#' + this.group_template).html();
        this.compiled_group_template = handlebars.compile(this.group_template_source);

        this.$pagination = $container.find('#pagination');
        this.$container = $container;

        this.category = [];
        this.types = [];

        this.modal = new Modal(this, $container.find('#modal'));

        this.setupControls();
        this.update();
    }

    update() {
        var params:any = {};
        params.category = this.category;
        params.types = this.types;
        $.getJSON(this.api_url, params, (data) => {
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
        $('#groups', this.$container).empty();
        this.$pagination.empty();

        // Append our new items
        var groups = (function (items, size) {
            var groups = [];
            while (items.length > 0) {
                groups.push(items.splice(0, size));
            }
            return groups;
        }(data.items, this.items_per_page));

        $.each(groups, (group_index, group) => {
            var data = '';
            $.each(group, (index, item:any) => {
                item.page = group_index + 1;
                var item_html = this.compiled_item_template(item);
                data += item_html;
            });

            var group_html = this.compiled_group_template({'data': data});
            $('#groups', this.$container).append(group_html);
        });

        // Setup pagination
        var pagination_click_callback = (e) => {
            var i = $(this).data('i');
            e.preventDefault();

            $('.state-current', $(this).closest('#pagination')).removeClass('state-current');
            $(this).parent().addClass('state-current');

            $('.group.state-current', this.$container).removeClass('state-current');
            $($('.group', this.$container)[i - 1]).addClass('state-current');
        }
        var group_elements = this.$container.find('.group');
        $(group_elements[0]).first().addClass('state-current');
        for (var i = 1; i <= group_elements.length; i++) {
            var $page = $('<li>');
            var $page_link = $('<a href="#"><span class="visual-hide">Page </span>' + i + '</a>');
            if (i === 1) {
                $page.addClass('state-current');
            }
            $page_link.data('i', i);
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
        var $modal = this.$container.find('#modal');
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
