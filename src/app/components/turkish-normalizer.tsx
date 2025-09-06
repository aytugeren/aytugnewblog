"use client";
import { useEffect } from "react";

// Best-effort fixer for mojibake Turkish characters introduced by mis-encoded source strings.
// It scans text nodes and replaces common broken sequences with correct Turkish.
const replacements: Array<[RegExp, string]> = [
  [/YǬkleniyor/g, "Yükleniyor"],
  [/G��rǬntǬle/g, "Görüntüle"],
  [/DǬzenle/g, "Düzenle"],
  [/HenǬz/g, "Henüz"],
  [/Y�netim/g, "Yönetim"],
  [/��k��/g, "Çıkış"],
  [/Ho�/g, "Hoş"],
  [/Giri�Y/g, "Giriş"],
  [/ba�Yar��s��z/g, "başarısız"],
  [/Kullan��c��/g, "Kullanıcı"],
  [/al��namad��/g, "alınamadı"],
  [/yǬklendi/gi, "yüklendi"],
  [/Ǭzerinden/g, "üzerinden"],
  [/de�Yil/g, "değil"],
  [/Ziyaret�iler/g, "Ziyaretçiler"],
  [/CV �ndirme/g, "CV İndirme"],
  [/�?�/g, " • "],
  [/Aytu�Y/g, "Aytuğ"],
  [/yaz��/g, "yazı"],
  [/i��/g, "i"],
  [/��/g, "ş"],
  [/�o/g, "ö"],
  [/�- /g, "ö"],
];

function replaceText(text: string): string {
  let out = text;
  for (const [re, to] of replacements) {
    out = out.replace(re, to);
  }
  return out;
}

function walk(node: Node) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  const toChange: Text[] = [];
  let t: Node | null;
  // collect first to avoid live updates during walk
  // eslint-disable-next-line no-cond-assign
  while ((t = walker.nextNode())) {
    const txt = (t as Text).data;
    const fixed = replaceText(txt);
    if (fixed !== txt) {
      toChange.push(t as Text);
    }
  }
  for (const n of toChange) {
    n.data = replaceText(n.data);
  }
}

export function TurkishNormalizer() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    // initial run
    walk(document.body);
    // observe DOM changes to fix late-rendered nodes
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              const txt = (n as Text).data;
              const fixed = replaceText(txt);
              if (fixed !== txt) (n as Text).data = fixed;
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              walk(n);
            }
          });
        } else if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          const tn = m.target as Text;
          const fixed = replaceText(tn.data);
          if (fixed !== tn.data) tn.data = fixed;
        }
      }
    });
    mo.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}

