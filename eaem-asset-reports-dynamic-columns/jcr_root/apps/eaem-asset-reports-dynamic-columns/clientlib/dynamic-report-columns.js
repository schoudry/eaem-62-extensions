(function ($, $document) {
    var VIEW_SETTINGS_COLUMN_CONFIG = {},
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        REPORTS_FORM = "#customcolumnsForm",
        METADATA_COL_MAPPING = "data-eaem-col-mapping",
        METADATA_COL_TITLE = "data-eaem-col-title",
        EAEM_COL = "eaemCol",
        FORM_FIELD_WRAPPER = ".coral-Form-fieldwrapper",
        COOKIE_REPORT_LIST_VIEW_COLUMNS = "eaem.report.listview.columns",
        REPORTS_CONFIGURE_COLUMNS_DIALOG = "reports-configure-columns-dialog",
        COLUMNS_IN_URL = "/apps/eaem-asset-reports-dynamic-columns/dialog/modal.html",
        DYNAMIC_COLS_CONFIG_URL = "/etc/experience-aem/report-columns/jcr:content/list.infinity.json";

    loadColumnsConfiguration();

    $document.on(FOUNDATION_CONTENT_LOADED, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    function loadColumnsConfiguration() {
        if(!_.isEmpty(VIEW_SETTINGS_COLUMN_CONFIG)){
            return;
        }

        $.ajax(DYNAMIC_COLS_CONFIG_URL).done(function(data){
            if(_.isEmpty(data)){
                return;
            }

            _.each(data, function(obj, key){
                if(key.indexOf("item") !== 0){
                    return;
                }

                VIEW_SETTINGS_COLUMN_CONFIG[obj.value] = obj["jcr:title"];
            });
        });
    }

    function handleContentLoad(event){
        var target = event.target;

        if(isConfigureColumnsDialog(target)){
            addDynamicColumnsInModal();
        }
    }

    function isConfigureColumnsDialog(target){
        if(!target || (target.tagName !== "CORAL-DIALOG")){
            return false;
        }

        var $target = (!target.$ ? $(target) : target.$);

        return $target.hasClass(REPORTS_CONFIGURE_COLUMNS_DIALOG);
    }

    function addDynamicColumnsInModal(){
        var url = COLUMNS_IN_URL + getReportPath();

        $.ajax(url).done(handler);

        function handler(html){
            if(_.isEmpty(html)){
                return;
            }

            var $html, $column, $input, $form = $(REPORTS_FORM),
                enabledColumns = getEnabledColumnsObj()[getReportPath()];

            _.each(VIEW_SETTINGS_COLUMN_CONFIG, function(colTitle, colPath){
                $html = $(html);

                $input = $html.find("input[title='" + EAEM_COL + "']")
                    .attr(METADATA_COL_MAPPING, colPath);

                if(contains(enabledColumns, colPath)){
                    $input.attr("checked", "checked");
                }

                $input.attr("onchange", "EAEM.REPORT.storeEnabledColumns()");

                $column = $input.closest(FORM_FIELD_WRAPPER);

                $column.find(".coral-Checkbox-description").html(colTitle);

                $form.append($column[0].outerHTML);
            });

            styleDialog();
        }
    }

    function getReportPath(){
        return $('input[name=dam-asset-report]:checked').attr("report-path");
    }

    function getEnabledColumnsObj(){
        var cookieValue = getCookie(COOKIE_REPORT_LIST_VIEW_COLUMNS);

        if(!cookieValue){
            cookieValue = {};
        }else{
            cookieValue = JSON.parse(decodeURIComponent(cookieValue));
        }

        return cookieValue;
    }

    function storeEnabledColumns(){
        var $input, columns = [], colMapping;

        $(REPORTS_FORM).find("input:checked").each(function(index, input){
            $input = $(input);

            colMapping = $input.attr(METADATA_COL_MAPPING);

            if(_.isEmpty(colMapping)){
                return;
            }

            columns.push(colMapping);
        });

        var cookieObj = getEnabledColumnsObj();

        cookieObj[getReportPath()] = columns;

        addCookie(COOKIE_REPORT_LIST_VIEW_COLUMNS, JSON.stringify(cookieObj));
    }

    function getCookie(cookieName){
        var cookieValue = "";

        if(_.isEmpty(cookieName)){
            return;
        }

        var cookies = document.cookie.split(";"), tokens;

        _.each(cookies, function(cookie){
            tokens = cookie.split("=");

            if(tokens[0].trim() !== cookieName){
                return;
            }

            cookieValue = tokens[1].trim();
        });

        return cookieValue;
    }

    function addCookie(cookieName, value){
        if(_.isEmpty(cookieName)){
            return;
        }

        $.cookie(cookieName, value, { expires: 365, path: "/" } );
    }

    function contains(arrOrObj, key){
        var doesIt = false;

        if(_.isEmpty(arrOrObj) || _.isEmpty(key)){
            return doesIt;
        }

        if(_.isArray(arrOrObj)){
            doesIt = (arrOrObj.indexOf(key) !== -1);
        }

        return doesIt;
    }

    function styleDialog(){
        var $form = $(REPORTS_FORM);

        $form.css("max-height", "21.5rem").css("overflow-y", "auto");
    }
})(jQuery, jQuery(document));