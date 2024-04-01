import * as vscode from 'vscode';
import { parse } from '@typescript-eslint/parser';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.applyCodeDepthStyles', () => {
    applyCodeDepthStyles();
  });

  context.subscriptions.push(disposable);
}

function applyCodeDepthStyles() {
  // Get the active text editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // Get the document text
  const document = editor.document;
  const text = document.getText();

  // Parse the TypeScript code and determine the scope depths
  const scopeDepths = parseScopeDepths(text);

  // Create decorations for each scope depth
  const decorations: vscode.DecorationOptions[] = [];
  scopeDepths.forEach((depth, index) => {
    const decoration: vscode.DecorationOptions = {
		range: new vscode.Range(document.positionAt(index), document.positionAt(index + 1)),
		hoverMessage: `Scope Depth: ${depth}`,
		renderOptions: {
		  before: {
			contentText: ' ',
			backgroundColor: `hsl(${depth * 60}, 100%, 50%)`,
			margin: '0 2px',
			width: '4px',
			height: '1em',
		  },
		},
	  };
    decorations.push(decoration);
  });

  // Apply the decorations to the text editor
  editor.setDecorations(vscode.window.createTextEditorDecorationType({}), decorations);
}

function parseScopeDepths(text: string): number[] {
	const ast = parse(text, {
	  loc: true,
	  range: true,
	  tokens: true,
	  comment: true,
	  jsx: true,
	});
  
	const scopeDepths: number[] = Array(text.length).fill(0);
  
	let currentDepth = 0;
  
	function traverseNode(node: TSESTree.Node) {
		if (node.type === AST_NODE_TYPES.BlockStatement || node.type === AST_NODE_TYPES.FunctionDeclaration) {
		  currentDepth++;
		}
	  
		if (node.range) {
		  for (let i = node.range[0]; i < node.range[1]; i++) {
			scopeDepths[i] = currentDepth;
		  }
		}
	  
		if (node.type === AST_NODE_TYPES.Program) {
		  (node as TSESTree.Program).body.forEach(traverseNode);
		} else if (node.type === AST_NODE_TYPES.BlockStatement) {
		  (node as TSESTree.BlockStatement).body.forEach(traverseNode);
		} else if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
		  traverseNode((node as TSESTree.FunctionDeclaration).body);
		}
	  
		if (node.type === AST_NODE_TYPES.BlockStatement || node.type === AST_NODE_TYPES.FunctionDeclaration) {
		  currentDepth--;
		}
	  }
  
	traverseNode(ast);
  
	return scopeDepths;
  }