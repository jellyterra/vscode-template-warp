// Copyright 2025 Jelly Terra <jellyterra@proton.me>
// Use of this source code form is governed under the MIT license.

import { existsSync, readdirSync, readFileSync } from 'fs';
import * as vscode from 'vscode';

function getExtensionConfig() {
	return vscode.workspace.getConfiguration("template");
}

function getWorkspaceRoot() {
	return vscode.workspace.workspaceFolders![0].uri.path;
}

function getGlobalTemplateStorageLocation() {
	return getExtensionConfig().get<string>("storageLocation")!;
}

function getProjectTemplateStorageLocation() {
	return `${getWorkspaceRoot()}/.vscode/templates`;
}

function collectTemplates(): vscode.QuickPickItem[] {
	const templates: any[] = [{ kind: vscode.QuickPickItemKind.Separator, label: "Project" }];

	const collect = (loc: string) => {
		for (const fileName of readdirSync(loc, { withFileTypes: true })) {
			if (!fileName.isFile()) {
				continue;
			}
			const [name, ext] = fileName.name.split(".", 2);
			templates.push({
				label: name.replaceAll("_", " "),
				description: ext,

				ext: ext,
				template: readFileSync(`${loc}/${fileName.name}`).toString(),
			});
		}
	};

	const projectTemplateLocation = getProjectTemplateStorageLocation();
	if (existsSync(projectTemplateLocation)) {
		collect(projectTemplateLocation);
	}

	templates.push({ kind: vscode.QuickPickItemKind.Separator, label: "Global" });

	const globalTemplateLocation = getExtensionConfig().get<string>("storageLocation")!!;
	if (existsSync(globalTemplateLocation)) {
		collect(globalTemplateLocation);
	}

	return templates;
}

function createFile(directory: vscode.Uri) {
	const templates = collectTemplates();
	if (templates.length === 2) {
		vscode.window.showErrorMessage("No available file template found. Create one?", "Yes", "No").then(ans => {
			if (ans === "Yes") {
				createTemplate();
			}
		});
		return;
	}

	vscode.window.showQuickPick(templates, { placeHolder: "Select template for the new file" }).then((choice: any) => {
		if (!choice) {
			return;
		}
		vscode.window.showInputBox({ placeHolder: "File name" }).then(name => {
			if (!name) {
				return;
			}
			const uri = vscode.Uri.parse(`file://${directory.path}/${name}.${choice.ext}`);
			vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(choice.template.replaceAll("__NAME__", name)));
			setTimeout(() => vscode.window.showTextDocument(uri), 500);
		});
	});
}

function createTemplate() {
	vscode.window.showInputBox({ placeHolder: "Template file name" }).then(name => {
		if (!name) {
			return;
		}
		vscode.window.showQuickPick(["Global", "Project"], { placeHolder: "Select template scope" }).then(scope => {
			switch (scope) {
				case "Global": {
					vscode.window.showInformationMessage(`file://${getGlobalTemplateStorageLocation()}/${name}`);
					const uri = vscode.Uri.parse(`file://${getGlobalTemplateStorageLocation()}/${name}`);
					vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(""));
					setTimeout(() => vscode.window.showTextDocument(uri), 500);
					break;
				}
				case "Project": {
					const uri = vscode.Uri.parse(`file://${getProjectTemplateStorageLocation()}/${name}`);
					vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(""));
					setTimeout(() => vscode.window.showTextDocument(uri), 500);
					break;
				}
			}
		});
	});
}

export function activate(context: vscode.ExtensionContext) {
	if (getGlobalTemplateStorageLocation() === "") {
		getExtensionConfig().update("storageLocation", context.globalStorageUri.path, vscode.ConfigurationTarget.Global);
	}

	const commands: [string, any][] = [
		["template-warp.createFile", createFile],
		["template-warp.createTemplate", createTemplate]
	];

	for (const [command, callback] of commands) {
		context.subscriptions.push(vscode.commands.registerCommand(command, callback));
	}
}

export function deactivate() {
	vscode.window.showInformationMessage("Template Warp deactivated.");
}
