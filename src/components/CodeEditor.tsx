"use client";

import { useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec, type Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";
import { cmLanguage } from "./cm-languages";

const theme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "transparent", color: "var(--fg)", fontSize: "13px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65", overflow: "auto" },
  ".cm-content": { caretColor: "var(--accent-hover)", padding: "14px 0 80px" },
  ".cm-line": { padding: "0 16px 0 8px" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--subtle)", border: "none" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 16px", minWidth: "36px", fontSize: "12px" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--hover) 60%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--muted)" },
  ".cm-cursor": { borderLeftColor: "var(--accent-hover)" },
  ".cm-selectionBackground": { backgroundColor: "var(--sel) !important" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "var(--sel) !important" },
  ".cm-placeholder": { color: "var(--subtle)" },
  ".cm-matchingBracket": { backgroundColor: "var(--active)", outline: "1px solid var(--border-strong)" },
});

const highlight = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--tok-comment)", fontStyle: "italic" },
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword], color: "var(--tok-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--tok-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--tok-number)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: "var(--tok-fn)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--tok-type)" },
  { tag: [t.propertyName, t.attributeName, t.variableName], color: "var(--tok-prop)" },
  { tag: [t.punctuation, t.operator, t.bracket, t.separator], color: "var(--tok-punct)" },
  { tag: [t.tagName], color: "var(--tok-keyword)" },
  { tag: [t.meta, t.processingInstruction], color: "var(--tok-punct)" },
]);

export default function CodeEditor({
  value,
  onChange,
  language,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
  onSubmit: () => void;
}) {
  // Keep the latest callback in a ref so the extension list only changes with the language.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  const extensions = useMemo(() => {
    const exts: Extension[] = [
      theme,
      syntaxHighlighting(highlight),
      placeholder("Paste code here, or drop files anywhere on this pane…"),
      // Cmd/Ctrl+Enter generates (instead of CodeMirror's "insert blank line").
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              submitRef.current();
              return true;
            },
          },
        ]),
      ),
    ];
    const lang = cmLanguage(language);
    if (lang) exts.push(lang);
    return exts;
  }, [language]);

  return (
    <div className="cm-host absolute inset-0">
      <CodeMirror
        value={value}
        onChange={onChange}
        height="100%"
        theme="none"
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: false,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
          searchKeymap: true,
          dropCursor: false,
        }}
      />
    </div>
  );
}