(function ($, $document) {
    var FOUNDATION_CONTENT_PERFORM = "foundation-layout-perform",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        OMNI_SEARCH_FORM = ".granite-omnisearch-form",
        GRANITE_OMNI_SEARCH_RESULT = "granite-omnisearch-result",
        COLUMN_LIST = "/etc/experience-aem/omni-search-columns/_jcr_content.list.json",
        COLUMN_CONFIG = {},
        METADATA_MAPPING = "data-metadata-mapping",
        METADATA_COLNAME = "data-metadata-colname",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content";

    loadColumnsConfiguration();

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    function handleContentLoad(event){
        if (event.target.id !== GRANITE_OMNI_SEARCH_RESULT) {
            return;
        }

        var layout = $(event.target).data("foundationLayout");

        if(layout.layoutId !== "list"){
            return;
        }

        addColumnHeaders();

        fillColumnData();
    }

    function fillColumnData($listView, enabledColumns){
        var $container = $(GRANITE_OMNI_SEARCH_CONTENT);

        collectionIterate({});

        function collectionIterate(data){
            $("tr.foundation-collection-item").each(function(index, item){
                itemHandler(data, $(item) );
            });
        }

        function itemHandler(data, $row){
            if(!_.isEmpty($row.find("[" + METADATA_MAPPING + "]"))){
                return;
            }

            var itemPath = $row.data("foundation-collection-item-id"), metaValue;

            _.each(COLUMN_CONFIG, function(colName, colMetaPath){
                $row.append(getListCellHtml(colMetaPath, "Test"));
            });
        }
    }

    function addColumnHeaders(){
        if(checkIFHeadersAdded()){
            return;
        }

        var headerHtml, $fui = $(window).adaptTo("foundation-ui"),
            $container = $(GRANITE_OMNI_SEARCH_CONTENT),
            $headRow = $container.find("thead > tr");

        _.each(COLUMN_CONFIG, function(headerText, metaRelPath){
            headerHtml = getTableHeader(metaRelPath, headerText);
            $headRow.append(headerHtml);
        });
    }

    function checkIFHeadersAdded(){
        return !_.isEmpty($(GRANITE_OMNI_SEARCH_CONTENT).find("tr").find("[" + METADATA_MAPPING + "]"));
    }

    function getListCellHtml(colMapping, colValue){
        return '<td is="coral-td" class="coral-Table-cell coral-Table-cell--left" alignment="column" '
                    + METADATA_MAPPING + '="' + colMapping + '">' +
                    '<coral-td-label class="coral-Table-cellLabel">'
                        + colValue +
                    '</coral-td-label>' +
                '</td>';
    }

    function getTableHeader(colMapping, colText) {
        return '<th is="coral-th" '
            + METADATA_MAPPING + '="' + colMapping + '">'
            + colText
            + '</th>';
    }

    function loadColumnsConfiguration(){
        $.ajax({
            url: COLUMN_LIST
        }).done(function(data){
            _.each(data, function(item){
                COLUMN_CONFIG[item.value] = item.text;
            })
        });
    }


    $document.on(FOUNDATION_CONTENT_PERFORM, function(event) {
    });

    $document.on(FOUNDATION_MODE_CHANGE, function(e, mode){
    });

})(jQuery, jQuery(document));