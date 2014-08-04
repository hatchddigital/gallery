define(["require", "exports", 'jquery'], function(require, exports, $) {
    

    /** A modal popup helper */
    var Modal = (function () {
        function Modal($el, inner) {
            if (typeof inner === "undefined") { inner = null; }
            this.$el = $el;
            this.inner = inner;
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
                if (_this.inner) {
                    _this.inner.handleNextPrev(direction);
                }
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
});
//# sourceMappingURL=modal.js.map
