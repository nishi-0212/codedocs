import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { csharp, kotlin } from "@codemirror/legacy-modes/mode/clike";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { r } from "@codemirror/legacy-modes/mode/r";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";

export function cmLanguage(id: string): Extension | null {
  switch (id) {
    case "python":
      return python();
    case "javascript":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "java":
      return java();
    case "c":
    case "cpp":
      return cpp();
    case "csharp":
      return StreamLanguage.define(csharp);
    case "go":
      return go();
    case "rust":
      return rust();
    case "php":
      return php();
    case "ruby":
      return StreamLanguage.define(ruby);
    case "swift":
      return StreamLanguage.define(swift);
    case "kotlin":
      return StreamLanguage.define(kotlin);
    case "sql":
      return sql();
    case "shell":
      return StreamLanguage.define(shell);
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "yaml":
      return StreamLanguage.define(yaml);
    case "lua":
      return StreamLanguage.define(lua);
    case "r":
      return StreamLanguage.define(r);
    default:
      return null;
  }
}
