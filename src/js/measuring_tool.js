AnnotationsEventsController.MEASURING_TOOL = 'measuring_tool';

AnnotationsEventsController.prototype.initializeMeasuringTool = function(polyline_config) {
    // by default, initialize dummy tool
    this.initializeDummyTool();

    if (!(AnnotationsEventsController.MEASURING_TOOL  in this.initialized_tools)) {

        this.annotation_controller.ruler = undefined;
        this.annotation_controller.ruler_id = 'ruler';
        this.annotation_controller.ruler_config =
            (typeof polyline_config === 'undefined') ? {} : polyline_config;
        // VERY IMPORTANT!!! set polyline_config fill_alpha to 0!
        this.annotation_controller.ruler_config.fill_alpha = 0;

        this.annotation_controller.ruler_out_id = undefined;

        this.annotation_controller._pointToRuler = function(x, y) {
            if (this.ruler) {
                this.ruler.addPoint(x, y);
            } else {
                this.drawPolyline(this.ruler_id, [], undefined,
                    this.ruler_config, false);
                this.selectShape(this.ruler_id);
                this.ruler = this.getShape(this.ruler_id);
                this.ruler.addPoint(x,y);
                $("#" + this.ruler_out_id).trigger('ruler_created');
            }
            this.refreshView();
        };

        this.annotation_controller.addPointToRuler = function(event) {
            this._pointToRuler(event.point.x, event.point.y);
        };

        this.annotation_controller.replaceLastRulerPoint = function(event) {
            this.ruler.removePoint();
            this.addPointToRuler(event);
        };

        this.annotation_controller.removeLastRulerPoint = function() {
            try {
                this.ruler.removePoint();
                this.refreshView();
            } catch (err) {
                this.clearRuler();
            }
        };

        this.annotation_controller.clearRuler = function(ruler_saved) {
            if (typeof this.ruler !== 'undefined') {
                this.deleteShape(this.ruler_id);
                this.ruler = undefined;
            }
            $('#' + this.ruler_out_id).trigger('ruler_cleared', [ruler_saved]);
        };

        this.annotation_controller.getRulerMeasure = function() {
            if (typeof this.ruler !== 'undefined') {
                return this.ruler.getPerimeter(this.image_mpp);
            }
        };

        this.annotation_controller.serializeRuler = function() {
            var $ruler_out = $("#" + this.ruler_out_id);
            var ruler_json = this.getShapeJSON(this.ruler_id);
            var ac = this;
            ruler_json.points = $.map(ruler_json.points, function(point) {
                return {
                    'x': point.x + ac.x_offset,
                    'y': point.y + ac.y_offset
                }
            });
            ruler_json.shape_id = this._getShapeId('ruler');
            $ruler_out.data('ruler_json', ruler_json);
        };

        this.annotation_controller.updateOutputField = function() {
            var measure = this.getRulerMeasure();
            if (typeof this.ruler_out_id === 'undefined') {
                console.log('Current ruler measure is: ' + measure + ' microns');
            } else {
                var $ruler_out = $("#" + this.ruler_out_id);
                if ($ruler_out.is('input')) {
                    $ruler_out.val(measure);
                } else if ($ruler_out.is('div') || $ruler_out.is('p')){
                    $ruler_out.text(measure);
                } else {
                    console.warn('output field with ID ' + this.ruler_out_id + ' is not handled');
                }
            }
        };

        var aec = this;
        this.annotation_controller.bindToRuler = function(switch_on_id, switch_off_id, output_field_id) {
            // first of all, bind tool activation
            aec._bind_switch(switch_on_id, AnnotationsEventsController.MEASURING_TOOL);
            // then bind extra behaviour for click
            $('#' + switch_on_id).bind(
                'click',
                {'annotation_controller': this},
                function(event) {
                    event.data.annotation_controller.ruler_out_id = output_field_id;
                    $('#' + output_field_id).trigger('start_new_ruler');
                }
            );
            $('#' + switch_off_id).bind(
                'click',
                {'annotation_controller': this},
                function(event) {
                    var ac = event.data.annotation_controller;
                    console.log('clicked on the SWITCH OFF button');
                    ac.serializeRuler();
                    ac.clearRuler(true);
                }
            );
        };

        var ruler_tool = new paper.Tool();

        ruler_tool.annotations_controller = this.annotation_controller;

        ruler_tool.onMouseDown = function(event) {
            this.annotations_controller.addPointToRuler(event);
        };

        ruler_tool.onMouseDrag = function(event) {
            this.annotations_controller.replaceLastRulerPoint(event);
        };

        ruler_tool.onMouseUp = function(event) {
            this.annotations_controller.updateOutputField();
        };

        this.initialized_tools[AnnotationsEventsController.MEASURING_TOOL] = ruler_tool;

    } else {
        console.warn('Tool"' + AnnotationsEventsController.MEASURING_TOOL + '" already initialized');
    }
};