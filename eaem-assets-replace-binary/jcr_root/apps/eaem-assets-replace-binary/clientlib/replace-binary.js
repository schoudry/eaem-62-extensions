(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        EDIT_ACTIVATOR = "aem-assets-admin-actions-edit-activator",
        fui = $(window).adaptTo("foundation-ui"),
        REPLACE_PULL_DOWN_URL = "/apps/eaem-assets-replace-binary/button/replace-binary.html";

    $document.on(FOUNDATION_CONTENT_LOADED, function(){
    });

    $document.on("foundation-mode-change", function(e, mode){
        if(mode !== "selection" ){
            return;
        }

        $.ajax(REPLACE_PULL_DOWN_URL).done(addButton);
    });

    function addButton(html){
        var $eActivator = $("." + EDIT_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $replacePulldown = $(html).insertBefore( $eActivator );
    }
}($, $(document)));