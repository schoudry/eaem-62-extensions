(function ($, $document) {
    var DATA_EAEM_NESTED = "data-eaem-nested",
        CFFW = ".coral-Form-fieldwrapper",
        RTE_CONTAINER = "richtext-container",
        FIELD_ERROR_EL = $("<span class='coral-Form-fielderror coral-Icon coral-Icon--alert coral-Icon--sizeS' " +
                                "data-init='quicktip' data-quicktip-type='error' />");

    function addValidator($multifield){
        var $rteContainer = $multifield.find("." + RTE_CONTAINER).last(),
            requiredField = $rteContainer.find("[aria-required='true']");

        if(_.isEmpty(requiredField)){
            return;
        }

        //coral validation framework ignores hidden and contenteditable fields, so add an invisible text field
        //the text field is just for registering a validator
        $rteContainer.append("<input type=text style='display:none' aria-required='true'/>");
    }

    function setSelect($field, value){
        var select = $field.closest(".coral-Select").data("select");

        if(select){
            select.setValue(value);
        }
    }

    function setHiddenOrRichText($field, value){
        $field.val(value);

        var $rteContainer = $field.parent();

        if(!$rteContainer.hasClass(RTE_CONTAINER)){
            return;
        }

        $rteContainer.children(".coral-RichText-editable").empty().append(value);
    }

    function setCheckBox($field, value){
        $field.prop( "checked", $field.attr("value") == value);
    }

    //reads multifield data from server, creates the nested composite multifields and fills them
    function addDataInFields() {
        function getMultiFieldNames($multifields){
            var mNames = {}, mName;

            $multifields.each(function (i, multifield) {
                mName = $(multifield).children("[name$='@Delete']").attr("name");

                mName = mName.substring(0, mName.indexOf("@"));

                mName = mName.substring(2);

                mNames[mName] = $(multifield);
            });

            return mNames;
        }

        function buildMultiField(data, $multifield, mName){
            if(_.isEmpty(mName) || _.isEmpty(data)){
                return;
            }

            $(".js-coral-Multifield-add").click(function(){
                var $multifield = $(this).parent();

                setTimeout(function(){
                    addValidator($multifield);
                }, 500);
            });

            _.each(data, function(value, key){
                if(key == "jcr:primaryType"){
                    return;
                }

                $multifield.find(".js-coral-Multifield-add").click();

                _.each(value, function(fValue, fKey){
                    if(fKey == "jcr:primaryType"){
                        return;
                    }

                    var $field = $multifield.find("[name='./" + fKey + "']").last(),
                        type = $field.prop("type");

                    if(_.isEmpty($field)){
                        return;
                    }

                    if(type == "select-one"){
                        setSelect($field, fValue);
                    }else if(type == "checkbox"){
                        setCheckBox($field, fValue);
                    }else if(type == "hidden"){
                        setHiddenOrRichText($field, fValue);
                    }else{
                        $field.val(fValue);
                    }
                });
            });
        }

        $(document).on("dialog-ready", function() {
            var $multifields = $("[" + DATA_EAEM_NESTED + "]");

            if(_.isEmpty($multifields)){
                return;
            }

            var mNames = getMultiFieldNames($multifields),
                $form = $(".cq-dialog"),
                actionUrl = $form.attr("action") + ".infinity.json";

            $.ajax(actionUrl).done(postProcess);

            function postProcess(data){
                _.each(mNames, function($multifield, mName){
                    buildMultiField(data[mName], $multifield, mName);
                });
            }
        });
    }

    //collect data from widgets in multifield and POST them to CRX
    function collectDataFromFields(){
        function fillValue($form, fieldSetName, $field, counter){
            var name = $field.attr("name");

            if (!name) {
                return;
            }

            //strip ./
            if (name.indexOf("./") == 0) {
                name = name.substring(2);
            }

            var value = $field.val();

            if( $field.prop("type") == "checkbox" ){
                value = $field.prop("checked") ? $field.val() : "";
            }

            $('<input />').attr('type', 'hidden')
                .attr('name', fieldSetName + "/" + counter + "/" + name)
                .attr('value', value )
                .appendTo($form);

            //remove the field, so that individual values are not POSTed
            $field.remove();
        }

        $(document).on("click", ".cq-dialog-submit", function () {
            var $multifields = $("[" + DATA_EAEM_NESTED + "]");

            if(_.isEmpty($multifields)){
                return;
            }

            var $form = $(this).closest("form.foundation-form"),
                $fieldSets, $fields;

            $multifields.each(function(i, multifield){
                $fieldSets = $(multifield).find("[class='coral-Form-fieldset']");

                $fieldSets.each(function (counter, fieldSet) {
                    $fields = $(fieldSet).children().children(CFFW);

                    $fields.each(function (j, field) {
                        fillValue($form, $(fieldSet).data("name"), $(field).find("[name]"), (counter + 1));
                    });
                });
            });
        });
    }

    $.validator.register({
        selector: ".richtext-container > input:text:last",

        validate: function ($invisibleText) {
            var cuiRichText = $invisibleText.prevAll(".coral-RichText-editable").data("richText");

            if(!cuiRichText || !cuiRichText.editorKernel){
                return;
            }

            var isRequired = ($invisibleText.attr("aria-required") === "true");

            if (isRequired && _.isEmpty(cuiRichText.editorKernel.getProcessedHtml())) {
                return "Please fill this field";
            }

            return null;
        },

        show: function ($invisibleText, message) {
            //this.clear($invisibleText);

            var $field = $invisibleText.prevAll(".coral-RichText-editable"),
                arrow = $invisibleText.closest("form").hasClass("coral-Form--vertical") ? "right" : "top";

            FIELD_ERROR_EL.clone()
                .attr("data-quicktip-arrow", arrow)
                .attr("data-quicktip-content", message)
                .insertAfter($field);

            $field.attr("aria-invalid", "true").toggleClass("is-invalid", true);
        },

        clear: function ($invisibleText) {
            var $field = $invisibleText.prevAll(".coral-RichText-editable");

            $field.removeAttr("aria-invalid").removeClass("is-invalid")
                .nextAll(".coral-Form-fielderror").tooltip("hide").remove();
        }
    });

    $document.ready(function () {
        addDataInFields();
        collectDataFromFields();
    });
}(jQuery, jQuery(document)));