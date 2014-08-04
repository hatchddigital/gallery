define(["require", "exports", 'jquery', 'handlebars'], function(require, exports, $, handlebars) {
    /** A modal popup helper */
    var Modal = (function () {
        function Modal(gallery, $el) {
            this.$el = $el;
            this.gallery = gallery;
            this.init();
        }
        Modal.prototype.init = function (e) {
            var _this = this;
            if (typeof e === "undefined") { e = null; }
            this.$el.find('.close').click(function (e) {
                e.preventDefault();
                _this.hide();
            });
            this.$el.find('.next,.previous').click(function (e) {
                var direction = $(_this).attr('id');
                e.preventDefault();
                _this.gallery.handleNextPrev(direction);
            });
        };

        Modal.prototype.show = function (e) {
            if (typeof e === "undefined") { e = null; }
            this.$el.addClass('state-active');
        };

        Modal.prototype.hide = function (e) {
            if (typeof e === "undefined") { e = null; }
            this.$el.removeClass('state-active');
        };

        Modal.prototype.setContent = function (content, hasprev, hasnext) {
            this.$el.find('.content').html(content);

            if (hasprev) {
                this.$el.find('.previous').show();
            } else {
                this.$el.find('.previous').hide();
            }

            if (hasnext) {
                this.$el.find('.next').show();
            } else {
                this.$el.find('.next').hide();
            }
        };

        Modal.prototype.setHeading = function (heading) {
            this.$el.find('.heading').text(heading);
        };
        return Modal;
    })();
    exports.Modal = Modal;

    var Gallery = (function () {
        function Gallery($container, group, item) {
            if (typeof group === "undefined") { group = "#gallery-group-template"; }
            if (typeof item === "undefined") { item = "#gallery-item-template"; }
            this.api_url = window.location.pathname + '/gallery.json';
            this.items_per_page = 1;

            var item_template_source = $(item).html();
            var group_template_source = $(group).html();
            this.compiled_item_template = handlebars.compile(item_template_source);
            this.compiled_group_template = handlebars.compile(group_template_source);

            this.$pagination = $container.find('.pagination');
            this.$container = $container;

            this.category = [];
            this.types = [];

            this.modal = new Modal(this, $container.find('.modal'));

            this.setupControls();
            this.update();
        }
        Gallery.prototype.update = function () {
            var _this = this;
            var params = {};
            params.category = this.category;
            params.types = this.types;
            $.getJSON(this.api_url, params, function (data) {
                _this.callback(data);
            });
        };

        Gallery.prototype.setupControls = function (e) {
            var _this = this;
            if (typeof e === "undefined") { e = null; }
            var typeChangeCallback = function () {
                var types = [];
                $('.filter--types a.state-active').each(function () {
                    types.push($(this).data('type'));
                });
                _this.types = types;

                if (!types.length) {
                    $('.filter--types a').addClass('state-active');
                }
            };

            var categoryChangeCallback = function () {
                _this.category = $('.filter--category a.state-active').data('category') || null;
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
        };

        Gallery.prototype.callback = function (data) {
            var _this = this;
            // Cleanup
            $('.groups', this.$container).empty();
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

            $.each(groups, function (group_index, group) {
                var data = '';
                $.each(group, function (index, item) {
                    item.page = group_index + 1;
                    var item_html = _this.compiled_item_template(item);
                    data += item_html;
                });

                var group_html = _this.compiled_group_template({ 'data': data });
                $('.groups', _this.$container).append(group_html);
            });

            // Setup pagination
            var pagination_click_callback = function (e) {
                var i = $(_this).data('i');
                e.preventDefault();

                $('.state-current', $(_this).closest('.pagination')).removeClass('state-current');
                $(_this).parent().addClass('state-current');

                $('.group.state-current', _this.$container).removeClass('state-current');
                $($('.group', _this.$container)[i - 1]).addClass('state-current');
            };
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
        };

        Gallery.prototype.setPage = function (i) {
            this.$pagination.find('a')[i - 1].click();
        };

        Gallery.prototype.getPageGroup = function (i) {
            return this.$container.find('.group')[i - 1];
        };

        Gallery.prototype.getCurrentPageNumber = function () {
            return parseInt(this.$pagination.find('.state-current a').data('i'), 10);
        };

        Gallery.prototype.getTotalPages = function () {
            return this.$pagination.find('.state-current a').data('i');
        };

        Gallery.prototype.handleExpand = function () {
            var that = this;
            var $modal = this.$container.find('.modal');
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
                if (currentPageNumber < this.$container.find('.group').length) {
                    $item = $(this.getPageGroup(currentPageNumber + 1)).find('.gallery-item:first');
                }
            }
            return $item;
        };

        Gallery.prototype.setActive = function ($el) {
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
            } else {
                $content.find('.expanded-media').append('<iframe width="100%" height="400" src="//www.youtube.com/embed/' + $el.data('youtube-id') + '" frameborder="0" allowfullscreen="allowfullscreen"></iframe>');
            }

            // Update the modal dialog
            this.modal.setContent($content, hasprev, hasnext);
            this.modal.setHeading(($el.index() + 1) + ' of ' + this.$container.find('.gallery-item').length);
            this.modal.show();
        };

        Gallery.prototype.handleNextPrev = function (direction) {
            var $activeEl = this.$container.find('.gallery-item.state-active');

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