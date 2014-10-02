/// <reference path="defs/jquery/jquery.d.ts"/>
/// <reference path="defs/handlebars/handlebars.d.ts"/>
import $ = require('jquery');
import handlebars = require('handlebars');

/** A modal popup helper */
export class Modal {

    $el:any;
    gallery:any;

    constructor($el, gallery:any = null) {
        this.$el = $el;
        this.gallery = gallery;
        this.init();
    }

    init() {
        this.$el.find('.close').click((e) => {
            e.preventDefault();
            this.close();
        });
        if (this.gallery) {
            this.$el.find('.next, .previous').click((e) => {
                var direction = $(e.currentTarget).data('direction');
                e.preventDefault();
                this.gallery.handleNextPrev(direction);
            });
        }
        else {
            this.$el.find('.next, .previous').addClass('state--hidden');
        }
    }

    show(e:any = null) {
        this.$el.addClass('state--active');
        $('body').addClass('modal--active');
    }

    close(e:any = null) {
        this.$el.removeClass('state--active');
        $('body').removeClass('modal--active');
        // Empty the contents of the modal so youtube videos stop playing
        this.$el.find('.modal-content').empty();
    }

    setContent(content, hasPrev, hasNext) {
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
    }

    setHeading(heading) {
        this.$el.find('.heading').text(heading);
    }
}
