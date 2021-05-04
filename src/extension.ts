import 'reflect-metadata';
import * as vscode from 'vscode';
import registerLogPointManagementCommands from './ui/commands/logPointManagement';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import { ILiveLogDecorationProvider } from './ui/decoration/liveLogDecorationProvider';
import { ILogPointDecorationProvider } from './ui/decoration/logPointDecorationProvider';
import createRootContainer from './ui/ioc/rootContainer';
import { ILogPointRecommender } from './ui/logPoint/logPointRecommender';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);
  context.subscriptions.push(rootContainer);

  registerLogPointManagementCommands(context, rootContainer);

  vscode.debug.registerDebugConfigurationProvider(
    NodeWithRxJSDebugConfigurationResolver.type,
    rootContainer.get<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
  );

  const logPointRecommender = rootContainer.get<ILogPointRecommender>(ILogPointRecommender);
  const logPointDecorationProvider = rootContainer.get<ILogPointDecorationProvider>(ILogPointDecorationProvider);
  const liveLogDecorationProvider = rootContainer.get<ILiveLogDecorationProvider>(ILiveLogDecorationProvider);

  if (vscode.window.activeTextEditor) {
    logPointDecorationProvider.attach(vscode.window.activeTextEditor);
    liveLogDecorationProvider.attach(vscode.window.activeTextEditor);
  }

  vscode.workspace.onDidChangeTextDocument(({ document }) => {
    logPointRecommender.recommend(document);
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      logPointDecorationProvider.attach(editor);
      liveLogDecorationProvider.attach(editor);
    } else {
      logPointDecorationProvider.detach();
      liveLogDecorationProvider.detach();
    }
  });
}

export function deactivate(): void {
  // Nothing to do.
}
