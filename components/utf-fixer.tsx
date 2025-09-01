"use client";
import { useEffect } from "react";

function decodeLatin1Utf8(s: string) {
  try {
    // Fix Latin-1 interpreted UTF-8 (e.g., Ã¼ -> ü)
    const decoded = decodeURIComponent(escape(s));
    return decoded;
  } catch {
    return s;
  }
}

function decodeUnicodeEscapes(s: string) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

export function UtfFixer() {
  useEffect(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = /Ã|Å|Ä|Â|Ð|Ø|Þ|\\u00|\\n|\\r|\\t/;
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = (n as Text).nodeValue || "";
      if (bad.test(t)) nodes.push(n as Text);
    }
    nodes.forEach((node) => {
      const t = node.nodeValue || "";
      let fixed = decodeLatin1Utf8(t);
      fixed = decodeUnicodeEscapes(fixed);
      fixed = fixed.replace(/\\n|\\r|\\t/g, " ").replace(/\s{2,}/g, " ");
      if (fixed !== t) node.nodeValue = fixed;
    });
  }, []);
  return null;
}
