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
            this.$el.find('.next, .previous').hide();
        }
    }

    show(e:any = null) {
        this.$el.addClass('state--active');
    }

    close(e:any = null) {
        this.$el.removeClass('state--active');
    }

    setContent(content, hasPrev, hasNext) {
        this.$el.find('.modal-content').html(content);

        if (hasPrev) {
            this.$el.find('.previous').show();
        }
        else {
            this.$el.find('.previous').hide();
        }

        if (hasNext) {
            this.$el.find('.next').show();
        }
        else {
            this.$el.find('.next').hide();
        }
    }

    setHeading(heading) {
        this.$el.find('.heading').text(heading);
    }
}
