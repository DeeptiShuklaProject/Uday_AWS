/**
 * Monaco setup — bundle monaco-editor locally (no CDN dependency) and
 * hand the instance to @monaco-editor/react's loader. Only the base
 * editor worker is registered; language-service workers aren't needed
 * for read-only viewing.
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = { getWorker: () => new editorWorker() };
loader.config({ monaco });

export { monaco };
