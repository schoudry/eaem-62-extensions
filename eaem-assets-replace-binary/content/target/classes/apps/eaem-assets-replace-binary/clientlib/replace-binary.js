(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        FOUNDATION_WIZARD_STEPCHANGE = "foundation-wizard-stepchange",
        EDIT_ACTIVATOR = "aem-assets-admin-actions-edit-activator",
        REPLACE_WITH_AEM_FILE = ".replace-with-aem-file",
        EAEM_BINARY_REPLACE = "#eaem-binary-replace",
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        PLACEHOLDER_DEST = "PLACEHOLDER_DEST",
        PLACEHOLDER_SRC = "PLACEHOLDER_SRC",
        REPLACE_WITH_ASSET_PATH = "replaceWithAssetPath",
        TO_BE_REPLACED_ASSET_PATH = "toBeReplacedAssetPath",
        fui = $(window).adaptTo("foundation-ui"),
        SUBMIT_URL = "/bin/eaem/replace-binary",
        SELECT_ASSET_URL = "/apps/eaem-assets-replace-binary/wizard/select-assets.html",
        REPLACE_PULL_DOWN_URL = "/apps/eaem-assets-replace-binary/button/replace-binary.html";

    var pathName = window.location.pathname;

    if(pathName.indexOf("/assets.html") === 0){
        handleAssetsConsole();
    }else if (pathName.indexOf(SELECT_ASSET_URL) === 0){
        handleSelectAssetsWizard();
    }

    function handleSelectAssetsWizard(){
        var replaceWithAssetPath, submitHandlerAdded = false,
            toBeReplacedAssetPath = queryParameters()[TO_BE_REPLACED_ASSET_PATH] ;

        $document.on(FOUNDATION_CONTENT_LOADED, handleFirstStep);

        function handleFirstStep(){
            var stepNumber = getWizardStepNumber();

            if(stepNumber !== 1){
                return;
            }

            var $cancelBut = getWizardCancelButton();

            $cancelBut.on("click", function(){
                window.parent.location.reload();
            });

            $document.on(FOUNDATION_SELECTIONS_CHANGE, ".foundation-collection", disableNextIfNoAssetsSelected);

            $document.on(FOUNDATION_WIZARD_STEPCHANGE, handleWizardSteps);
        }

        function handleWizardSteps(event, nextStep){
            var stepNumber = getWizardStepNumber();

            if(stepNumber !== 2){
                return;
            }

            var $nextStep = $(nextStep), html = $nextStep.html(),
                dest = getStringAfterLastSlash(replaceWithAssetPath),
                src = getStringAfterLastSlash(toBeReplacedAssetPath);

            $nextStep.html(html.replace(PLACEHOLDER_DEST, dest).replace(PLACEHOLDER_SRC, src));

            if(submitHandlerAdded){
                return;
            }

            submitHandlerAdded = true;

            var $nextButton = getCurrentStepNextButton();

            $nextButton.on("click", registerSubmitHandler);
        }

        function registerSubmitHandler(){
            var url = SUBMIT_URL + REPLACE_WITH_ASSET_PATH + "=" + replaceWithAssetPath + "&"
                            + TO_BE_REPLACED_ASSET_PATH + "=" + toBeReplacedAssetPath;

            fui.wait();

            $.ajax({url : url, type: "POST"}).done(function(){
                fui.clearWait();

                var dest = getStringAfterLastSlash(replaceWithAssetPath),
                    src = getStringAfterLastSlash(toBeReplacedAssetPath);

                showAlert("File '" + src + "' replaced with '" + dest + "'", 'Replaced', callback);
            });

            function callback(){
                window.parent.location.reload();
            }
        }

        function disableNextIfNoAssetsSelected(){
            var stepNumber = getWizardStepNumber();

            if(stepNumber !== 1){
                return;
            }

            disableWizardNext();

            var fSelections = $(".foundation-collection").adaptTo("foundation-selections");

            if(fSelections && (fSelections.count() > 1)){
                showAlert("Select one asset", 'Error');
                return;
            }

            replaceWithAssetPath = "";

            $(".foundation-selections-item").each(function(index, asset){
                replaceWithAssetPath = $(asset).data("foundation-collection-item-id");
            });

            if(_.isEmpty(replaceWithAssetPath) || _.isEmpty(toBeReplacedAssetPath)){
                return;
            }

            var destExtn = getStringAfterLastDot(replaceWithAssetPath),
                srcExtn = getStringAfterLastDot(toBeReplacedAssetPath);

            if (destExtn !== srcExtn) {
                var dest = decodeURIComponent(getStringAfterLastSlash(replaceWithAssetPath)),
                    src = decodeURIComponent(getStringAfterLastSlash(toBeReplacedAssetPath));

                showAlert("'" + dest + "' and '" + src + "' donot have the same extension", 'Error');

                replaceWithAssetPath = "";

                return;
            }

            if(!_.isEmpty(replaceWithAssetPath)){
                enableWizardNext();
            }
        }

        function disableWizardNext(){
            toggleWizard(false);
        }

        function enableWizardNext(){
            toggleWizard(true);
        }

        function toggleWizard(isEnable){
            var $wizard = $(".foundation-wizard");

            if(_.isEmpty($wizard)){
                return;
            }

            var wizardApi = $wizard.adaptTo("foundation-wizard");
            wizardApi.toggleNext(isEnable);
        }

        function getWizardCancelButton(){
            var $wizard = $(".foundation-wizard");

            return $($wizard.find("[data-foundation-wizard-control-action=cancel]")[0]);
        }

        function getWizardStepNumber(){
            var $wizard = $(".foundation-wizard"),
                currentStep = $wizard.find(".foundation-wizard-step-active"),
                wizardApi = $wizard.adaptTo("foundation-wizard");

            return wizardApi.getPrevSteps(currentStep).length + 1;
        }

        function getCurrentStepNextButton(){
            var stepNumber = getWizardStepNumber(),
                $wizard = $(".foundation-wizard");

            return $($wizard.find("[data-foundation-wizard-control-action=next]")[stepNumber - 1]);
        }
    }

    function handleAssetsConsole(){
        var replaceDialog = null, folderPath;

        $document.on(FOUNDATION_MODE_CHANGE, function(e, mode){
            if(mode !== "selection" ){
                return;
            }

            var $replaceButton = $(EAEM_BINARY_REPLACE);

            if(!_.isEmpty($replaceButton)){
                handleReplaceWithAEMFile();
                return;
            }

            $.ajax(REPLACE_PULL_DOWN_URL).done(addButton);
        });

        function addButton(html){
            var $eActivator = $("." + EDIT_ACTIVATOR);

            if ($eActivator.length == 0) {
                return;
            }

            $(html).insertBefore( $eActivator );

            handleReplaceWithAEMFile();
        }

        function handleReplaceWithAEMFile(){
            var $childPage = $(DAM_ADMIN_CHILD_PAGES),
                foundationLayout = $childPage.data("foundation-layout"),
                $replaceAEMFile = $(REPLACE_WITH_AEM_FILE);

            if(_.isEmpty(foundationLayout)){
                return;
            }

            folderPath = $childPage.data("foundation-collection-id");

            var toBeReplacedAssetPath;

            $(".foundation-selections-item").each(function(index, asset){
                toBeReplacedAssetPath = $(asset).data("foundation-collection-item-id");
            });

            replaceDialog = getReplaceAEMFileDialog(folderPath + "?toBeReplacedAssetPath=" + toBeReplacedAssetPath);

            $replaceAEMFile.click(function(){
                replaceDialog.show();
            });
        }

        function getReplaceAEMFileDialog(path){
            return new Coral.Dialog().set({
                closable: "on",
                header: {
                    innerHTML: 'File Replace'
                },
                content: {
                    innerHTML: getReplaceAEMFileDialogContent(path)
                }
            });
        }

        function getReplaceAEMFileDialogContent(path){
            var url = SELECT_ASSET_URL + path;

            return "<iframe width='1300px' height='700px' frameBorder='0' src='" + url + "'></iframe>";
        }
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }

    function getStringAfterLastDot(str){
        if(!str || (str.indexOf(".") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf(".") + 1);
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "default", options, callback);
    }

    function queryParameters(searchStr) {
        var result = {}, param,
            params = (searchStr ? searchStr.split(/\?|\&/) : document.location.search.split(/\?|\&/));

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }
}($, $(document)));