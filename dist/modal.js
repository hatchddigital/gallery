define(["require", "exports", 'jquery'], function(require, exports, $) {
    /** A modal popup helper */
    var Modal = (function () {
        function Modal($el, gallery) {
            if (typeof gallery === "undefined") { gallery = null; }
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
            } else {
                this.$el.find('.next, .previous').hide();
            }
        };

        Modal.prototype.show = function (e) {
            if (typeof e === "undefined") { e = null; }
            this.$el.addClass('state--active');
        };

        Modal.prototype.close = function (e) {
            if (typeof e === "undefined") { e = null; }
            this.$el.removeClass('state--active');
        };

        Modal.prototype.setContent = function (content, hasPrev, hasNext) {
            this.$el.find('.modal-content').html(content);

            if (hasPrev) {
                this.$el.find('.previous').show();
            } else {
                this.$el.find('.previous').hide();
            }

            if (hasNext) {
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
});
//# sourceMappingURL=modal.js.map
