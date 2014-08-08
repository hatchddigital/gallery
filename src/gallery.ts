/// <reference path="defs/jquery/jquery.d.ts" />
/// <reference path="defs/handlebars/handlebars.d.ts" />
import $ = require('jquery');
import handlebars = require('handlebars');
import modal = require('./modal');

export class Gallery {

    api_url:string;
    api_params:any;
    data:any[];
    items_per_page:number;
    compiled_item_template:any;
    compiled_group_template:any;
    $pagination:any;3
    $container:any;
    category:any[];
    types:any[];
    modal:modal.Modal;

    constructor($container, settings:any = {}) {
        this.$container = $container;
        this.$pagination = $container.find('.pagination');

        this.api_url = settings.api_url || window.location.pathname + '/gallery.json';
        this.data = settings.data || null;
        this.api_params = {};
        this.items_per_page = parseInt(settings.items_per_page || 12, 10);

        var item_template = settings.item_template || '#gallery-item-template';
        var group_template = settings.group_template || '#gallery-group-template';
        var item_template_source = $(item_template).html();
        var group_template_source = $(group_template).html();

        this.compiled_item_template = handlebars.compile(item_template_source);
        this.compiled_group_template = handlebars.compile(group_template_source);

        this.category = [];
        this.types = [];

        this.modal = new modal.Modal($container.find('.modal'), this);
        this.beforeInit();
        this.update();
        this.afterInit();
    }

    beforeInit() {
        // override
    }
    afterInit() {
        // override
    }

    update() {
        if (this.data) {
            this.callback(this.data);
        }
        else {
            $.getJSON(this.api_url, this.api_params, (data) => {
                this.callback(data);
            });
        }
    }

    callback(data) {
        // Cleanup
        $('.gallery-groups', this.$container).empty();
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
        })(data.items, this.items_per_page);

        var item_index = 1;
        $.each(groups, (group_index, group) => {
            var data = '';
            $.each(group, (index, item:any) => {
                item.page = group_index + 1;
                item.item_index = item_index;
                var item_html = this.compiled_item_template(item);
                data += item_html;
                item_index = item_index + 1;
            });

            var group_html = this.compiled_group_template({'data': data});
            this.$container.find('.gallery-groups').append(group_html);
        });

        this.setupPagination();
    }

    setupPagination() {
        // Setup pagination
        var pagination_click_callback = (e) => {
            var $pageEl = $(e.currentTarget);
            var i = $pageEl.data('i');
            e.preventDefault();

            $('.state--current', $pageEl.closest('.pagination')).removeClass('state--current');
            $pageEl.parent().addClass('state--current');

            $('.gallery-group.state--current', this.$container).removeClass('state--current');
            $($('.gallery-group', this.$container)[i - 1]).addClass('state--current');

            this.$pagination.find('.pagination-control--prev, .pagination-control--next').removeClass('inactive');
            if (i === 1) {
                this.$pagination.find('.pagination-control--prev').addClass('inactive');
            }
            if (i === this.$pagination.find('.pagination-control--pages a').length) {
                this.$pagination.find('.pagination-control--next').addClass('inactive');
            }
        }
        var group_elements = this.$container.find('.gallery-group');
        var $pagination_controls = $('<ul class="pagination-controls" />');
        var $pagination_control_pages = $('<ul class="pagination-controls pagination-control--pages" />');

        if (group_elements.length > 1) {
            $pagination_controls.append('<li class="pagination-control pagination-control--prev"><a href="#">Previous</a></li>');
        }
        $pagination_controls.append($pagination_control_pages);
        if (group_elements.length > 1) {
            $pagination_controls.append('<li class="pagination-control pagination-control--next"><a href="#">Next</a></li>');
        }

        $pagination_controls.find('.pagination-control a').on('click', (e) => {
            e.preventDefault();
            var $el = $(e.currentTarget);
            if ($el.parent().hasClass('pagination-control--prev')) {
                this.setPage(this.getCurrentPageNumber() - 1);
            }
            if ($el.parent().hasClass('pagination-control--next')) {
                this.setPage(this.getCurrentPageNumber() + 1);
            }
        });

        for (var i = 1; i <= group_elements.length; i++) {
            var $page = $('<li class="pagination-control">');
            var $page_link = $('<a href="#">Page ' + i + '</a>');
            $page_link.attr('data-i', i);
            $page_link.on('click', pagination_click_callback);
            $page.append($page_link);
            $pagination_control_pages.append($page);
        }
        this.$pagination.append($pagination_controls);

        this.setPage(1);
        this.handleExpand();
    }

    setPage(i) {
        this.$pagination.find('.pagination-control--pages a')[i - 1].click();
    }

    getPageGroup(i) {
        return this.$container.find('.gallery-group')[i - 1];
    }

    getCurrentPageNumber() {
        return parseInt(this.$pagination.find('.state--current a').data('i'), 10);
    }

    handleExpand() {
        var that = this;
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
            if (currentPageNumber < this.$container.find('.gallery-group').length) {
                $item = $(this.getPageGroup(currentPageNumber + 1)).find('.gallery-item:first');
            }
        }
        return $item;
    }

    setActive($el) {
        var hasPrev;
        var hasNext;
        var $content = $el.find('.gallery-item-full').clone();
        var currentPageNumber = this.getCurrentPageNumber();

        // If the current page is not that of the element's, switch to that page
        if (currentPageNumber !== $el.data('page')) {
            this.setPage($el.data('page'));
        }
        // Run this after the page has been adjusted.
        hasPrev = this.findPrevItem($el).length > 0;
        hasNext = this.findNextItem($el).length > 0;

        // Set the active gallery item
        this.$container.find('.gallery-item.state--active').removeClass('state--active');
        $el.addClass('state--active');

        // Swap out the enlarged media
        if (!$el.data('youtube-id')) {
            $content.find('.modal-media .modal-media-src').append('<img src="' + $el.data('image-large') + '" alt="' + $el.find('.expand img').attr('alt') + '">');
        }
        else {
            $content.find('.modal-media .modal-media-src').append('<iframe width="100%" height="400" src="//www.youtube.com/embed/' + $el.data('youtube-id') + '" frameborder="0" allowfullscreen="allowfullscreen"></iframe>');
        }

        // Update the modal dialog
        this.modal.setContent($content.html(), hasPrev, hasNext);
        this.modal.setHeading($el.data('item-index') + ' of ' + this.$container.find('.gallery-item').length);
        this.modal.show();
    }

    handleNextPrev(direction) {
        var $activeEl = this.$container.find('.gallery-item.state--active');

        if (direction === 'next') {
            this.setActive(this.findNextItem($activeEl));
        }
        else {
            this.setActive(this.findPrevItem($activeEl));
        }
    }
}
