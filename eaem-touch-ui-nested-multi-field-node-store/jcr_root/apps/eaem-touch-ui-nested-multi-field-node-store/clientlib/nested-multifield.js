(function ($, $document) {
    var DATA_EAEM_NESTED = "data-eaem-nested",
        CFFW = ".coral-Form-fieldwrapper";

    function isCheckbox($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "checkbox");
    }

    function addDataInFields() {
        $document.on("dialog-ready", dlgReadyHandler);

        function dlgReadyHandler() {
            var mName = $("[" + DATA_EAEM_NESTED + "]").data("name");

            if(!mName){
                return;
            }

            //strip ./
            mName = mName.substring(2);

            var $fieldSets = $("[" + DATA_EAEM_NESTED + "][class='coral-Form-fieldset']"),
                $form = $fieldSets.closest("form.foundation-form"),
                actionUrl = $form.attr("action") + ".json";

            $.ajax(actionUrl).done(postProcess);

            function postProcess(data){
                if(!data || !data[mName]){
                    return;
                }

                var mValues = data[mName], $field, name;

                if(_.isString(mValues)){
                    mValues = [ JSON.parse(mValues) ];
                }

                _.each(mValues, function (record, i) {
                    if (!record) {
                        return;
                    }

                    if(_.isString(record)){
                        record = JSON.parse(record);
                    }

                    _.each(record, function(rValue, rKey){
                        $field = $($fieldSets[i]).find("[name='./" + rKey + "']");

                        if(_.isArray(rValue) && !_.isEmpty(rValue)){
                            fillNestedFields( $($fieldSets[i]).find("[data-init='multifield']"), rValue);
                        }else{
                            $field.val(rValue);
                        }
                    });
                });
            }

            //creates & fills the nested multifield with data
            function fillNestedFields($multifield, valueArr){
                _.each(valueArr, function(record, index){
                    $multifield.find(".js-coral-Multifield-add").click();

                    _.each(record, function(value, key){
                        var $field = $($multifield.find("[name='./" + key + "']")[index]);
                        $field.val(value);
                    })
                })
            }
        }
    }

    function fillValue($form, fieldSetName, $field, counter){
        var name = $field.attr("name"), value;

        if (!name) {
            return;
        }

        //strip ./
        if (name.indexOf("./") === 0) {
            name = name.substring(2);
        }

        value = $field.val();

        if (isCheckbox($field)) {
            value = $field.prop("checked") ? $field.val() : "";
        }

        //remove the field, so that individual values are not POSTed
        $field.remove();

        $('<input />').attr('type', 'hidden')
            .attr('name', fieldSetName + "/" + counter + "/" + name)
            .attr('value', value)
            .appendTo($form);
    }

    function addNestedMultifieldData($form, outerMultiName, $nestedMultiField){
        var $fieldSets = $nestedMultiField.find("[class='coral-Form-fieldset']"),
            nName = $fieldSets.data("name"), $fields;

        if(!nName){
            return;
        }

        //strip ./
        nName = outerMultiName + "/" + nName.substring(2);

        $fieldSets.each(function (iCounter, fieldSet) {
            $fields = $(fieldSet).find("[name]");

            $fields.each(function (counter, field) {
                fillValue($form, nName, $(field), (iCounter + 1));
            });
        });
    }

    //collect data from widgets in multifield and POST them to CRX as JSON
    function collectDataFromFields(){
        $document.on("click", ".cq-dialog-submit", collectHandler);

        function collectHandler() {
            var $form = $(this).closest("form.foundation-form"),
                mName = $("[" + DATA_EAEM_NESTED + "]").data("name"),
                $fieldSets = $("[" + DATA_EAEM_NESTED + "][class='coral-Form-fieldset']");

            var $fields, $field, name, $nestedMultiField;

            $fieldSets.each(function (oCounter, fieldSet) {
                $fields = $(fieldSet).children().children(CFFW);

                $fields.each(function (counter, field) {
                    $field = $(field);

                    //may be a nested multifield
                    $nestedMultiField = $field.find("[data-init='multifield']");

                    if($nestedMultiField.length == 0){
                        fillValue($form, mName, $(field).find("[name]"), (oCounter + 1));
                    }else{
                        addNestedMultifieldData($form, mName + "/" + (oCounter + 1) , $nestedMultiField);
                    }
                });
            });
        }
    }

    $document.ready(function () {
        addDataInFields();
        collectDataFromFields();
    });

    //extend otb multifield for adjusting event propagation when there are nested multifields
    //for working around the nested multifield add and reorder
    CUI.Multifield = new Class({
        toString: "Multifield",
        extend: CUI.Multifield,

        construct: function () {
            this.script = this.$element.find(".js-coral-Multifield-input-template:last");
        },

        _addListeners: function () {
            this.superClass._addListeners.call(this);

            //otb coral event handler is added on selector .js-coral-Multifield-add
            //any nested multifield add click events are propagated to the parent multifield
            //to prevent adding a new composite field in both nested multifield and parent multifield
            //when user clicks on add of nested multifield, stop the event propagation to parent multifield
            this.$element.on("click", ".js-coral-Multifield-add", function (e) {
                e.stopPropagation();
            });

            this.$element.on("drop", function (e) {
                e.stopPropagation();
            });
        }
    });

    CUI.Widget.registry.register("multifield", CUI.Multifield);
})(jQuery, jQuery(document));