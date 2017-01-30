(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        RTE_LINK_DIALOG = "rtelinkdialog";

    if(CUI.rte.ui.cui.CuiDialogHelper.eaemExtended){
        return;
    }

    var EAEMLinkBaseDialog = new Class({
        extend: CUI.rte.ui.cui.LinkBaseDialog,

        toString: "EAEMLinkBaseDialog",

        initialize: function(config) {
            this.superClass.initialize.call(this, config);

            this.$rteDialog = this.$container.find("[data-rte-dialog]");

            this.$rteDialog.find(".coral-Popover-content").append(getLinkRelOptionsHtml());
        }
    });

    CUI.rte.ui.cui.CuiDialogHelper = new Class({
        extend: CUI.rte.ui.cui.CuiDialogHelper,

        toString: "EAEMCuiDialogHelper",

        instantiateDialog: function(dialogConfig) {
            var type = dialogConfig.type;

            if(type !== RTE_LINK_DIALOG){
                this.superClass.instantiateDialog.call(this, dialogConfig);
                return;
            }

            var $editable = $(this.editorKernel.getEditContext().root),
                $container = CUI.rte.UIUtils.getUIContainer($editable),
                dialog = new EAEMLinkBaseDialog();

            dialog.attach(dialogConfig, $container, this.editorKernel);

            return dialog;
        }
    });

    function getLinkRelOptionsHtml(){
        var html =  "<div class='coral-RichText-dialog-columnContainer'>" +
                    "<div class='coral-RichText-dialog-column'>" +
                    "<coral-select placeholder='Choose \"rel\" attribute'>";

        var options = ["alternate", "author", "bookmark", "external", "help",
                        "license", "next", "nofollow", "noreferrer", "noopener", "prev", "search", "tag" ];

        _.each(options, function(option){
            html = html + getOptionHtml(option);
        });

        html = html + "</coral-select></div></div>";

        return html;

        function getOptionHtml(option){
            return "<coral-select-item>" + option + "</coral-select-item>"
        }
    }

    var EAEM_TABLE = new Class({
        toString: "EAEMTable",

        extend: CUI.rte.commands.Table,

        transferConfigToTable: function(dom, execDef) {
            this.superClass.transferConfigToTable.call(this, dom, execDef);

            var com = CUI.rte.Common,
                config = execDef.value;

            if (config.summary) {
                com.setAttribute(dom, "summary", config.summary);
            } else {
                com.removeAttribute(dom, "summary");
            }
        }
    });

    CUI.rte.commands.CommandRegistry.register("_table", EAEM_TABLE);
    CUI.rte.ui.cui.CuiDialogHelper.eaemExtended = true;
})(jQuery);
