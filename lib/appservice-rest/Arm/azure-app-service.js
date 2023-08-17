"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAppService = exports.WebsiteEnableSyncUpdateSiteKey = void 0;
const AzureRestClient_1 = require("azure-actions-webclient/AzureRestClient");
const ErrorHandlerUtility_1 = require("azure-actions-appservice-rest/Arm/ErrorHandlerUtility");
const core = require("@actions/core");
exports.WebsiteEnableSyncUpdateSiteKey = "WEBSITE_ENABLE_SYNC_UPDATE_SITE";
class AzureAppService {
    constructor(endpoint, resourceGroup, name, slot, isConsumptionApp) {
        this._client = new AzureRestClient_1.ServiceClient(endpoint, 30);
        this._resourceGroup = resourceGroup;
        this._name = name;
        this._slot = (slot && slot.toLowerCase() == "production") ? null : slot;
        this._slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
        this._isConsumptionApp = isConsumptionApp;
    }
    get(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceConfigurationDetails) {
                this._appServiceConfigurationDetails = yield this._get();
            }
            return this._appServiceConfigurationDetails;
        });
    }
    restart() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
                var webRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{ResourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/restart`, {
                        '{ResourceGroupName}': this._resourceGroup,
                        '{name}': this._name
                    }, null, '2016-08-01')
                };
                console.log("Restarting app service: " + this._getFormattedName());
                var response = yield this._client.beginRequest(webRequest);
                core.debug(`Restart response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    console.log('Deployment passed');
                }
                else if (response.statusCode == 202) {
                    yield this._client.getLongRunningOperationResult(response);
                }
                else {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                console.log("Restarted app service: " + this._getFormattedName());
            }
            catch (error) {
                throw Error("Failed to restart app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getPublishingProfileWithSecrets(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServicePublishingProfile) {
                this._appServicePublishingProfile = yield this._getPublishingProfileWithSecrets();
            }
            return this._appServicePublishingProfile;
        });
    }
    getPublishingCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/publishingcredentials/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to fetch publishing credentials for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getSitePublishingCredentialPolicies() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/basicPublishingCredentialsPolicies/scm`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2022-03-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get SitePublishingCredentialPolicies. " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getApplicationSettings(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceApplicationSetings) {
                this._appServiceApplicationSetings = yield this._getApplicationSettings();
            }
            return this._appServiceApplicationSetings;
        });
    }
    updateApplicationSettings(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to update application settings for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    patchApplicationSettings(addProperties, deleteProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            var applicationSettings = yield this.getApplicationSettings();
            var isNewValueUpdated = false;
            for (var key in addProperties) {
                if (applicationSettings.properties[key] != addProperties[key]) {
                    core.debug(`Value of ${key} has been changed to ${addProperties[key]}`);
                    isNewValueUpdated = true;
                }
                applicationSettings.properties[key] = addProperties[key];
            }
            for (var key in deleteProperties) {
                if (key in applicationSettings.properties) {
                    delete applicationSettings.properties[key];
                    core.debug(`Removing app setting : ${key}`);
                    isNewValueUpdated = true;
                }
            }
            if (isNewValueUpdated) {
                applicationSettings.properties[exports.WebsiteEnableSyncUpdateSiteKey] = this._isConsumptionApp ? 'false' : 'true';
                yield this.updateApplicationSettings(applicationSettings);
            }
            return isNewValueUpdated;
        });
    }
    patchApplicationSettingsSlot(addProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            var appSettingsSlotSettings = yield this.getSlotConfigurationNames();
            let appSettingNames = appSettingsSlotSettings.properties.appSettingNames;
            var isNewValueUpdated = false;
            if (appSettingNames) {
                for (var key in addProperties) {
                    if (addProperties[key].slotSetting == true) {
                        if ((appSettingNames.length == 0) || (!appSettingNames.includes(addProperties[key].name))) {
                            appSettingNames.push(addProperties[key].name);
                        }
                        core.debug(`Slot setting updated for key : ${addProperties[key].name}`);
                        isNewValueUpdated = true;
                    }
                }
            }
            if (isNewValueUpdated) {
                yield this.updateSlotConfigSettings(appSettingsSlotSettings);
            }
            return isNewValueUpdated;
        });
    }
    syncFunctionTriggersViaHostruntime() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let i = 0;
                let retryCount = 5;
                let retryIntervalInSeconds = 2;
                let timeToWait = retryIntervalInSeconds;
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/hostruntime/admin/host/synctriggers`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2015-08-01')
                };
                while (true) {
                    var response = yield this._client.beginRequest(httpRequest);
                    if (response.statusCode == 200) {
                        return response.body;
                    }
                    else if (response.statusCode == 400) {
                        if (++i < retryCount) {
                            yield this._sleep(timeToWait);
                            timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                            continue;
                        }
                        else {
                            throw (0, AzureRestClient_1.ToError)(response);
                        }
                    }
                    else {
                        throw (0, AzureRestClient_1.ToError)(response);
                    }
                }
            }
            catch (error) {
                throw Error("Failed to sync triggers via host runtime for function app " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get configuration settings for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    updateConfiguration(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to update configuration settings for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    patchConfiguration(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PATCH',
                    body: JSON.stringify(properties),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to patch configuration settings for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getConnectionStrings(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceConnectionString) {
                this._appServiceConnectionString = yield this._getConnectionStrings();
            }
            return this._appServiceConnectionString;
        });
    }
    getSlotConfigurationNames(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceConfigurationSettings) {
                this._appServiceConfigurationSettings = yield this._getSlotConfigurationNames();
            }
            return this._appServiceConfigurationSettings;
        });
    }
    patchConnectionString(addProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            var connectionStringSettings = yield this.getConnectionStrings();
            var isNewValueUpdated = false;
            for (var key in addProperties) {
                if (JSON.stringify(connectionStringSettings.properties[key]) != JSON.stringify(addProperties[key])) {
                    core.debug(`Value of ${key} has been changed to ${JSON.stringify(addProperties[key])}`);
                    isNewValueUpdated = true;
                }
                connectionStringSettings.properties[key] = addProperties[key];
            }
            if (isNewValueUpdated) {
                yield this.updateConnectionStrings(connectionStringSettings);
            }
            return isNewValueUpdated;
        });
    }
    updateConnectionStrings(connectionStringSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(connectionStringSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/config/connectionstrings`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to update App service " + this._getFormattedName() + " Connection Strings.\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    patchConnectionStringSlot(addProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            var connectionStringSlotSettings = yield this.getSlotConfigurationNames();
            let connectionStringNames = connectionStringSlotSettings.properties.connectionStringNames;
            var isNewValueUpdated = false;
            if (connectionStringNames) {
                for (var key in addProperties) {
                    if (addProperties[key].slotSetting == true) {
                        if ((connectionStringNames.length == 0) || (!connectionStringNames.includes(key))) {
                            connectionStringNames.push(key);
                        }
                        core.debug(`Slot setting updated for key : ${key}`);
                        isNewValueUpdated = true;
                    }
                }
            }
            if (isNewValueUpdated) {
                yield this.updateSlotConfigSettings(connectionStringSlotSettings);
            }
        });
    }
    updateSlotConfigSettings(SlotConfigSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(SlotConfigSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/config/slotConfigNames`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to update App service " + this._getFormattedName() + " Configuration Slot Settings.\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    getMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get app service Meta data for " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    updateMetadata(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to update app serviceMeta data for " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    patchMetadata(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            var applicationSettings = yield this.getMetadata();
            for (var key in properties) {
                applicationSettings.properties[key] = properties[key];
            }
            yield this.updateMetadata(applicationSettings);
        });
    }
    getSlot() {
        return this._slot ? this._slot : "production";
    }
    _getPublishingProfileWithSecrets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/publishxml`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                var publishingProfile = response.body;
                return publishingProfile;
            }
            catch (error) {
                throw Error("Failed to fetch publishing profile for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    _getApplicationSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get application settings for app service " + this._getFormattedName() + ".\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    _getConnectionStrings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/config/connectionstrings/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get App service " + this._getFormattedName() + " Connection Strings.\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    _getSlotConfigurationNames() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/config/slotConfigNames`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error("Failed to get App service " + this._getFormattedName() + " Slot Configuration Names.\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    _get() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw (0, AzureRestClient_1.ToError)(response);
                }
                var appDetails = response.body;
                return appDetails;
            }
            catch (error) {
                throw Error("Failed to fetch app service " + this._getFormattedName() + " details.\n" + (0, ErrorHandlerUtility_1.getFormattedError)(error));
            }
        });
    }
    _getFormattedName() {
        return this._slot ? `${this._name}-${this._slot}` : this._name;
    }
    getName() {
        return this._name;
    }
    _sleep(sleepDurationInSeconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
}
exports.AzureAppService = AzureAppService;