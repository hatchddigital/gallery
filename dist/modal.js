define(["require", "exports", 'jquery'], function (require, exports, $) {
    /** A modal popup helper */
    var Modal = (function () {
        function Modal($el, gallery) {
            if (gallery === void 0) { gallery = null; }
            this.$el = $el;
            this.gallery = gallery;
            this.init();
        }
        Modal.prototype.init = function () {
            var _this = this;
            this.$el.find('.close').click(function (e) {
                e.preventDefault();
                _this.close();
            });
            if (this.gallery) {
                this.$el.find('.next, .previous').click(function (e) {
                    var direction = $(e.currentTarget).data('direction');
                    e.preventDefault();
                    _this.gallery.handleNextPrev(direction);
                });
            }
            else {
                this.$el.find('.next, .previous').addClass('state--hidden');
            }
        };
        Modal.prototype.show = function (e) {
            if (e === void 0) { e = null; }
            this.$el.addClass('state--active');
            $('body').addClass('modal--active');
        };
        Modal.prototype.close = function (e) {
            if (e === void 0) { e = null; }
            this.$el.removeClass('state--active');
            $('body').removeClass('modal--active');
            // Empty the contents of the modal so youtube videos stop playing
            this.$el.find('.modal-content').empty();
        };
        Modal.prototype.setContent = function (content, hasPrev, hasNext) {
            this.$el.find('.modal-content').html(content);
            if (hasPrev) {
                this.$el.find('.previous').removeClass('state--hidden');
            }
            else {
                this.$el.find('.previous').addClass('state--hidden');
            }
            if (hasNext) {
                this.$el.find('.next').removeClass('state--hidden');
            }
            else {
                this.$el.find('.next').addClass('state--hidden');
            }
            // Adjust the max width of the containing element so all the buttons line up
            var max_width = parseInt(this.$el.find('.modal-media-src img').attr('width'), 10);
            if (!max_width) {
                max_width = 1000;
            }
            // For videos, calculator the max width based of taking up half the height in a 5/3 ratio
            // 400p
            max_width = Math.min(max_width, ($(window).height() - 400 / 2) * (5 / 3));
            this.$el.find('.modal-container .modal-media-src').css('max-width', max_width);
            this.$el.find('.modal-container').css('max-width', Math.max(500, max_width));
            // Set the height so that we dont get vertical images pushing out of the screen.
            this.$el.find('.modal-container .modal-media-src > img').css('max-height', $(window).height() * 0.7);
        };
        Modal.prototype.setHeading = function (heading) {
            this.$el.find('.heading').text(heading);
        };
        return Modal;
    })();
    exports.Modal = Modal;
});
//# sourceMappingURL=modal.js.map