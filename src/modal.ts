/// <reference path="defs/jquery/jquery.d.ts"/>
/// <reference path="defs/handlebars/handlebars.d.ts"/>
import $ = require('jquery');
import handlebars = require('handlebars');

/** Pagination interface */
export interface HasNextPrev {
  handleNextPrev(direction:string);
}

/** A modal popup helper */
export class Modal {

    $el:any;
    inner:HasNextPrev;

    constructor($el, inner:HasNextPrev = null) {
        this.$el = $el;
        this.inner = inner;
        this.init();
    }

    init(e:any = null) {
        console.log("Found: ", this.$el);
        this.$el.find('.close').click((e) => {
            e.preventDefault();
            this.hide();
        });
        this.$el.find('.next,.previous').click((e) => {
            var direction = $(this).attr('id');
            e.preventDefault();
            if (this.inner) {
              this.inner.handleNextPrev(direction);
            }
        });
    }

    show(e:any = null) {
        this.$el.addClass('state-active');
    }

    hide(e:any = null) {
        this.$el.removeClass('state-active');
    }

    setContent(content, hasprev, hasnext) {
        this.$el.find('.content').html(content);

        if (hasprev) {
            this.$el.find('.previous').show();
        }
        else {
            this.$el.find('.previous').hide();
        }

        if (hasnext) {
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
