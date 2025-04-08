// ==UserScript==
// @name         auto inject tokenOptions
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  auto inject tokenOptions
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const tokenOptions = {
    Jjwxc: "token của bạn",
  };
  window.tokenOptions = tokenOptions;
})();
