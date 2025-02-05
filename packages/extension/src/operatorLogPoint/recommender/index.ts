import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import OperatorLogPoint from '..';
import { ILogger } from '../../logger';
import { IDisposable } from '../../util/types';
import { isSupportedDocument } from '../../workspaceMonitor/supportedDocument';
import getOperatorPositions from './parser';

export const IOperatorLogPointRecommender = Symbol('LogPointRecommender');

export interface IOperatorLogPointRecommendationEvent {
  documentUri: vscode.Uri;
  operatorLogPoints: ReadonlyArray<OperatorLogPoint>;
}
export interface IOperatorLogPointRecommender extends IDisposable {
  onRecommendOperatorLogPoints: vscode.Event<IOperatorLogPointRecommendationEvent>;
  recommend(document: vscode.TextDocument): void;
}

@injectable()
export default class OperatorLogPointRecommender implements IOperatorLogPointRecommender {
  private _onRecommendOperatorLogPoints = new vscode.EventEmitter<IOperatorLogPointRecommendationEvent>();
  get onRecommendOperatorLogPoints(): vscode.Event<IOperatorLogPointRecommendationEvent> {
    return this._onRecommendOperatorLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  async recommend(document: vscode.TextDocument): Promise<void> {
    if (!isSupportedDocument(document)) {
      return;
    }

    this.logger.info('OperatorLogPointRecommender', `Recommend log points for ${document.uri.toString()}`);

    const positions = await getOperatorPositions(document.getText());
    const logPoints = positions.map(
      ({ position, operatorName, operatorIdentifier }) =>
        new OperatorLogPoint(
          document.uri,
          new vscode.Position(position.line, position.character),
          {
            fileName: document.uri.fsPath,
            ...operatorIdentifier,
          },
          operatorName
        )
    );

    this._onRecommendOperatorLogPoints.fire({
      documentUri: document.uri,
      operatorLogPoints: logPoints,
    });
  }

  dispose(): void {
    this._onRecommendOperatorLogPoints.dispose();
  }
}
