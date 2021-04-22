// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { formatterConverter } from "./assets/features/formatterSettings/FormatterConverter";
import { ExampleManager, initializeSupportedProfileSettings, initializeSupportedVSCodeSettings, JavaConstants, SupportedSettings } from "./FormatterConstants";
import { DOMParser, XMLSerializer } from "xmldom";
import { ExampleKind, JavaFormatterSetting } from "./types";
export class JavaFormatterSettingsEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = "java.formatterSettingsEditor";

    private profileElementMap: Map<string, any>;
    private profileSettingMap: Map<string, string>;
    private supportedProfileSettings: JavaFormatterSetting[];
    private supportedVSCodeSettings: JavaFormatterSetting[];
    private settingsVersion: string;
    private settingsUrl: string | undefined;
    private settingsProfile: string | undefined;
    private exampleKind: ExampleKind;
    private document: any;

    constructor(private readonly context: vscode.ExtensionContext) {
        this.profileElementMap = new Map<string, any>();
        this.profileSettingMap = new Map<string, string>();
        this.settingsVersion = JavaConstants.JAVA_FORMATTER_SETTINGS_VERSION;
        this.settingsUrl = vscode.workspace.getConfiguration("java").get<string>(JavaConstants.SETTINGS_URL_KEY);
        this.settingsProfile = vscode.workspace.getConfiguration("java").get<string>(JavaConstants.SETTINGS_PROFILE_KEY);
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(`java.${JavaConstants.SETTINGS_URL_KEY}`)) {
                this.settingsUrl = vscode.workspace.getConfiguration("java").get<string>(JavaConstants.SETTINGS_URL_KEY);
            } else if (e.affectsConfiguration(`java.${JavaConstants.SETTINGS_PROFILE_KEY}`)) {
                this.settingsProfile = vscode.workspace.getConfiguration("java").get<string>(JavaConstants.SETTINGS_PROFILE_KEY);
            }
        }));
        this.exampleKind = ExampleKind.COMMON_EXAMPLE;
        this.supportedProfileSettings = [];
        this.supportedVSCodeSettings = [];
    }

    public async showFormatterSettingsEditor() {
        if (!this.settingsUrl) {
            vscode.window.showInformationMessage("No available Java Formatter Profile in the workspace, do you want to use a new profile?",
                "Yes", "No").then(async (messageResult) => {
                    if (messageResult === "Yes") {
                        vscode.commands.executeCommand(JavaConstants.OPEN_FORMATTER);
                    }
                });
        } else {
            const profilePath = this.getPath(this.settingsUrl);
            if (!profilePath) {
                return;
            }
            const resource = vscode.Uri.file(profilePath);
            vscode.commands.executeCommand("vscode.openWith", resource, "java.formatterSettingsEditor");
        }
    }

    private getPath(formatterUrl: string): string | undefined {
        if (!vscode.workspace.workspaceFolders) {
            return undefined;
        }
        if (!path.isAbsolute(formatterUrl)) {
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const file = path.resolve(workspaceFolder.uri.fsPath, formatterUrl);
                if (fs.existsSync(file)) {
                    return file;
                }
            }
        } else {
            return path.resolve(formatterUrl);
        }
        return undefined;
    }

    private async initializeFromProfile(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
        this.profileElementMap.clear();
        this.profileSettingMap.clear();
        const text: string = document.getText();
        if (text.trim().length === 0) {
            return;
        }
        this.document = new DOMParser().parseFromString(text);
        const profilesVersion = this.document.documentElement.getAttribute("version");
        if (profilesVersion) {
            this.settingsVersion = profilesVersion;
        }
        const profiles = this.document.documentElement.getElementsByTagName("profile");
        if (!profiles || profiles.length === 0) {
            throw new Error();
        }
        for (let i = 0; i < profiles.length; i++) {
            if (!this.settingsProfile || this.settingsProfile === profiles[i].getAttribute("name")) {
                const version = profiles[i].getAttribute("version");
                if (version) {
                    this.settingsVersion = version;
                }
                const settings = profiles[i].getElementsByTagName("setting");
                for (let j = 0; j < settings.length; j++) {
                    const id = settings[j].getAttribute("id");
                    const value = settings[j].getAttribute("value");
                    this.profileElementMap.set(id, settings[j]);
                    this.profileSettingMap.set(id, value);
                }
                break;
            }
        }
        this.supportedProfileSettings = initializeSupportedProfileSettings(Number(this.settingsVersion));
        for (const setting of this.supportedProfileSettings) {
            if (this.profileSettingMap.has(setting.id)) {
                const value = this.profileSettingMap.get(setting.id);
                if (!value) {
                    throw new Error();
                }
                setting.value = value;
            }
        }
        this.initSetting(webviewPanel, true);
    }

    private initSetting(webviewPanel: vscode.WebviewPanel, isProfileSetting: boolean): void {
        const settings = isProfileSetting ? this.supportedProfileSettings : this.supportedVSCodeSettings;
        for (const setting of settings) {
            webviewPanel.webview.postMessage({
                command: "VSCodeToWebview.initSetting",
                setting: setting,
            });
        }
    }

    private async findJavaSpecificSetting(setting: string): Promise<string | number | boolean | undefined> {
        const config = vscode.workspace.getConfiguration().get<Object>("[java]");
        if (!config) {
            return undefined;
        }
        const entries = Object.entries(config);
        let result: string | boolean | number | undefined;
        for (const entry of entries) {
            if (entry[0] === setting) {
                result = entry[1];
            }
        }
        return result;
    }

    private async inheritVSCodeSettings(webviewPanel: vscode.WebviewPanel) {
        this.supportedVSCodeSettings = initializeSupportedVSCodeSettings();
        const javaTabSize = await this.findJavaSpecificSetting("editor.tabSize");
        const javaSpacePolicy = await this.findJavaSpecificSetting("editor.insertSpaces");
        const vscodeTabSize = vscode.workspace.getConfiguration().get<number>("editor.tabSize");
        const vscodeSpacePolicy = vscode.workspace.getConfiguration().get<boolean>("editor.insertSpaces");
        const tabSize = (javaTabSize) ? javaTabSize : vscodeTabSize;
        const spacePolicy = (javaSpacePolicy) ? javaSpacePolicy : vscodeSpacePolicy;
        for (const setting of this.supportedVSCodeSettings) {
            if (setting.id === SupportedSettings.TABULATION_CHAR) {
                setting.value = (spacePolicy === false) ? "tab" : "space";
                this.profileSettingMap.set(setting.id, setting.value);
            } else if (setting.id === SupportedSettings.TABULATION_SIZE) {
                setting.value = String(tabSize);
                this.profileSettingMap.set(setting.id, setting.value);
            }
        }
        this.initSetting(webviewPanel, false);
    }

    private async formatWithProfileSettings(webviewPanel: vscode.WebviewPanel) {
        const content = await vscode.commands.executeCommand<string>("java.execute.workspaceCommand", "java.edit.stringFormatting", ExampleManager.getExample(this.exampleKind), JSON.stringify([...this.profileSettingMap]), this.settingsVersion);
        webviewPanel.webview.postMessage({
            command: "VSCodeToWebview.formattedCode",
            content: content,
        });
    }

    public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
        try {
            await this.initializeFromProfile(document, webviewPanel);
        } catch (e) {
            vscode.window.showErrorMessage("Fail to parse the formatter profile, please ensure the profile is valid.",
                "Open Profile").then(async (messageResult) => {
                    if (messageResult === "Open Profile") {
                        vscode.commands.executeCommand(JavaConstants.OPEN_FORMATTER);
                    }
                });
            return;
        }

        await this.inheritVSCodeSettings(webviewPanel);

        webviewPanel.onDidChangeViewState(async (e) => {
            if (e.webviewPanel === webviewPanel && e.webviewPanel.visible === true) {
                this.initSetting(webviewPanel, false);
                this.initSetting(webviewPanel, true);
            }
        });

        webviewPanel.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
        };
        const resourceUri = this.context.asAbsolutePath("./out/assets/formatter-settings/index.html");
        const buffer: string = fs.readFileSync(resourceUri).toString();
        webviewPanel.webview.html = buffer;

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(async (e: vscode.TextDocumentChangeEvent) => {
            if (e.document.uri.toString() !== document.uri.toString()) {
                return;
            }
            const changes: ReadonlyArray<vscode.TextDocumentContentChangeEvent> = e.contentChanges;
            if (changes.length === 0 || changes.length > 1) {
                return;
            }
            const text: string = changes[0].text;
            const element = new DOMParser().parseFromString(text);
            const id = element.documentElement.getAttribute("id");
            const value = element.documentElement.getAttribute("value");
            if (!id || !value) {
                return;
            }
            this.profileSettingMap.set(id, value);
            webviewPanel.webview.postMessage({
                command: "VSCodeToWebview.changeSetting",
                id: id,
                value: value,
            });
            for (const setting of this.supportedVSCodeSettings) {
                if (setting.id === id) {
                    setting.value = value;
                    break;
                }
            }
            this.formatWithProfileSettings(webviewPanel);
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            switch (e.command) {
                case "WebviewToVSCode.changeExampleKind": {
                    this.exampleKind = e.exampleKind;
                    break;
                }
                case "WebviewToVSCode.changeSetting": {
                    const settingValue: string = formatterConverter.valueConvert(e.id, e.value.toString());
                    if (!settingValue) {
                        return;
                    }
                    if (SupportedSettings.commonSettings.includes(e.id)) {
                        const config = vscode.workspace.getConfiguration(undefined, { languageId: "java" });
                        if (e.id === SupportedSettings.TABULATION_CHAR) {
                            const targetValue = (settingValue === "tab") ? false : true;
                            await config.update("editor.insertSpaces", targetValue, undefined, true);
                        } else if (e.id === SupportedSettings.TABULATION_SIZE) {
                            await config.update("editor.tabSize", Number(settingValue), undefined, true);
                        }
                        this.profileSettingMap.set(e.id, settingValue);
                        webviewPanel.webview.postMessage({
                            command: "VSCodeToWebview.changeSetting",
                            id: e.id,
                            value: settingValue,
                        });
                        for (const setting of this.supportedVSCodeSettings) {
                            if (setting.id === e.id) {
                                setting.value = settingValue;
                                break;
                            }
                        }
                        this.formatWithProfileSettings(webviewPanel);
                    } else {
                        await this.changeSetting(e.id, settingValue, document);
                    }
                    break;
                }
                default:
                    break;
            }
        });
    }

    private async changeSetting(id: string, value: string, document: vscode.TextDocument): Promise<void> {
        const profileElement = this.profileElementMap.get(id);
        if (!profileElement) {
            throw new Error();
        }
        const originSetting: string = new XMLSerializer().serializeToString(profileElement);
        const line: number = profileElement.lineNumber;
        const column: number = profileElement.columnNumber;
        await profileElement.setAttribute("value", value);
        const newSetting: string = new XMLSerializer().serializeToString(profileElement);
        const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(new vscode.Position(line - 1, column - 1), new vscode.Position(line - 1, column - 1 + originSetting.length)), newSetting);
        vscode.workspace.applyEdit(edit);
    }

}
