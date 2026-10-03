"use client";

import { useEffect } from "react";
import { readLanguage, SOURCE_LANGUAGE, TRANSLATED_LANGUAGES } from "@/lib/translation";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (options: object, elementId: string) => unknown } };
  }
}

// Google Translate wraps text nodes in <font>, which makes React's own DOM
// updates throw. Tolerate nodes that were moved out from under React.
function patchDomForTranslation() {
  const proto = Node.prototype as Node & { __passoPatched?: boolean };
  if (proto.__passoPatched) return;
  proto.__passoPatched = true;

  const removeChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };

  const insertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return insertBefore.call(this, newNode, referenceNode) as T;
  };
}

export default function PageTranslator() {
  useEffect(() => {
    const language = readLanguage();
    if (language === SOURCE_LANGUAGE || document.getElementById("google-translate-script")) return;

    patchDomForTranslation();

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      new TranslateElement(
        { pageLanguage: SOURCE_LANGUAGE, includedLanguages: TRANSLATED_LANGUAGES.join(","), autoDisplay: false },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div id="google_translate_element" hidden />;
}
