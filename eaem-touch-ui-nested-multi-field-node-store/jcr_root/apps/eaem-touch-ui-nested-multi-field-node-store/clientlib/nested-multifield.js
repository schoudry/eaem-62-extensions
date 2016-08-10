(function ($, $document) {
    var EAEM_NESTED = "eaem-nested",
        DATA_EAEM_NESTED = "data-" + EAEM_NESTED,
        CFFW = ".coral-Form-fieldwrapper",
        NODE_STORE = "NODE_STORE";

    function isNodeStoreMultifield(type) {
        return (type === NODE_STORE);
    }

    function isSelectOne($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "select-one");
    }

    function setSelectOne($field, value) {
        var select = $field.closest(".coral-Select").data("select");

        if (select) {
            select.setValue(value);
        }
    }

    function isCheckbox($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "checkbox");
    }

    function setCheckBox($field, value) {
        $field.prop("checked", $field.attr("value") === value);
    }

    function isDateField($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "hidden")
                    && $field.parent().hasClass("coral-DatePicker");
    }

    function setDateField($field, value) {
        var date = moment(new Date(value)),
            $parent = $field.parent();

        $parent.find("input.coral-Textfield").val(date.format($parent.attr("data-displayed-format")));

        $field.val(date.format($parent.attr("data-stored-format")));
    }


    function setWidgetValue($field, value) {
        if (_.isEmpty($field)) {
            return;
        }

        if(isSelectOne($field)) {
            setSelectOne($field, value);
        }else if(isCheckbox($field)) {
            setCheckBox($field, value);
        }else if(isDateField($field)) {
            setDateField($field, value);
        }else {
            $field.val(value);
        }
    }

    function getOuterMultifields(){
        var mNames = {}, mName, $multifield, $template,
            $multiTemplates = $(".js-coral-Multifield-input-template");

        $multiTemplates.each(function (i, template) {
            $template = $(template);
            $multifield = $($template.html());

            if(!isNodeStoreMultifield($multifield.data(EAEM_NESTED))){
                return;
            }

            mName = $multifield.data("name").substring(2);

            mNames[mName] = $template.closest(".coral-Multifield");
        });

        return mNames;
    }

    function buildOuterMultiField(data, $outerMultiField){
        var $field;

        _.each(data, function (value, key) {
            if (key === "jcr:primaryType") {
                return;
            }

            $outerMultiField.find(".js-coral-Multifield-add").click();

            _.each(value, function (fValue, fKey) {
                if (fKey === "jcr:primaryType") {
                    return;
                }

                $field = $outerMultiField.find("[name='./" + fKey + "']").last();

                if (_.isEmpty($field)) {
                    return;
                }

                setWidgetValue($field, fValue);
            });
        })
    }

    function addDataInFields() {
        $document.on("dialog-ready", dlgReadyHandler);

        function dlgReadyHandler() {
            var outerMultifields = getOuterMultifields(),
                $form = $("form.cq-dialog"),
                actionUrl = $form.attr("action") + ".infinity.json";

            $.ajax(actionUrl).done(postProcess);

            function postProcess(data){
                _.each(outerMultifields, function($outerMultifield, mName){
                    buildOuterMultiField(data[mName], $outerMultifield, mName);
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