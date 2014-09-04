define(["require", "exports", 'jquery', 'handlebars', './modal'], function(require, exports, $, handlebars, modal) {
    var Gallery = (function () {
        function Gallery($container, settings) {
            if (typeof settings === "undefined") { settings = {}; }
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
        Gallery.prototype.beforeInit = function () {
            // override
        };
        Gallery.prototype.afterInit = function () {
            // override
        };

        Gallery.prototype.update = function () {
            var _this = this;
            if (this.data) {
                this.callback(this.data);
            } else {
                $.getJSON(this.api_url, this.api_params, function (data) {
                    _this.callback(data);
                });
            }
        };

        Gallery.prototype.callback = function (data) {
            var _this = this;
            // Cleanup
            $('.gallery-groups', this.$container).empty();
            this.$pagination.empty();

            // Append our new items
            var groups = (function (items, size) {
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
            $.each(groups, function (group_index, group) {
                var data = '';
                $.each(group, function (index, item) {
                    item.page = group_index + 1;
                    item.item_index = item_index;
                    var item_html = _this.compiled_item_template(item);
                    data += item_html;
                    item_index = item_index + 1;
                });

                var group_html = _this.compiled_group_template({ 'data': data });
                _this.$container.find('.gallery-groups').append(group_html);
            });

            this.setupPagination();
        };

        Gallery.prototype.setupPagination = function () {
            var _this = this;
            // Setup pagination
            var pagination_click_callback = function (e) {
                var $pageEl = $(e.currentTarget);
                var i = $pageEl.data('i');
                e.preventDefault();

                $('.state--current', $pageEl.closest('.pagination')).removeClass('state--current');
                $pageEl.parent().addClass('state--current');

                $('.gallery-group.state--current', _this.$container).removeClass('state--current');
                $($('.gallery-group', _this.$container)[i - 1]).addClass('state--current');

                _this.$pagination.find('.pagination-control--prev, .pagination-control--next').removeClass('inactive');
                if (i === 1) {
                    _this.$pagination.find('.pagination-control--prev').addClass('inactive');
                }
                if (i === _this.$pagination.find('.pagination-control--pages a').length) {
                    _this.$pagination.find('.pagination-control--next').addClass('inactive');
                }
            };
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

            $pagination_controls.find('.pagination-control a').on('click', function (e) {
                e.preventDefault();
                var $el = $(e.currentTarget);
                if ($el.parent().hasClass('pagination-control--prev')) {
                    _this.setPage(_this.getCurrentPageNumber() - 1);
                }
                if ($el.parent().hasClass('pagination-control--next')) {
                    _this.setPage(_this.getCurrentPageNumber() + 1);
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
        };

        Gallery.prototype.setPage = function (i) {
            this.$pagination.find('.pagination-control--pages a')[i - 1].click();
        };

        Gallery.prototype.getPageGroup = function (i) {
            return this.$container.find('.gallery-group')[i - 1];
        };

        Gallery.prototype.getCurrentPageNumber = function () {
            return parseInt(this.$pagination.find('.state--current a').data('i'), 10);
        };

        Gallery.prototype.handleExpand = function () {
            var that = this;
            $('a.expand', this.$container).click(function (e) {
                e.preventDefault();
                that.setActive($(this).parent());
            });
        };

        Gallery.prototype.findPrevItem = function ($el) {
            var $item = $el.prev('.gallery-item');
            var currentPageNumber = this.getCurrentPageNumber();
            if (!$item.length) {
                if (currentPageNumber > 1) {
                    $item = $(this.getPageGroup(currentPageNumber - 1)).find('.gallery-item:last');
                }
            }
            return $item;
        };

        Gallery.prototype.findNextItem = function ($el) {
            var $item = $el.next('.gallery-item');
            var currentPageNumber = this.getCurrentPageNumber();
            if (!$item.length) {
                if (currentPageNumber < this.$container.find('.gallery-group').length) {
                    $item = $(this.getPageGroup(currentPageNumber + 1)).find('.gallery-item:first');
                }
            }
            return $item;
        };

        Gallery.prototype.setActive = function ($el) {
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
            } else {
                $content.find('.modal-media .modal-media-src').append('<iframe width="560" height="315" src="//www.youtube.com/embed/' + $el.data('youtube-id') + '" frameborder="0" allowfullscreen="allowfullscreen"></iframe>');
                if ($.fn.fitVids) {
                    $content.find('.modal-media .modal-media-src').fitVids();
                }
            }

            // Update the modal dialog
            this.modal.setContent($content.html(), hasPrev, hasNext);
            this.modal.setHeading($el.data('item-index') + ' of ' + this.$container.find('.gallery-item').length);
            this.modal.show();
        };

        Gallery.prototype.handleNextPrev = function (direction) {
            var $activeEl = this.$container.find('.gallery-item.state--active');

            if (direction === 'next') {
                this.setActive(this.findNextItem($activeEl));
            } else {
                this.setActive(this.findPrevItem($activeEl));
            }
        };
        return Gallery;
    })();
    exports.Gallery = Gallery;
});
//# sourceMappingURL=gallery.js.map
