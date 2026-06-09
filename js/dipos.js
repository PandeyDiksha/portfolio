/* DipOS — tiny window manager. No dependencies. */
(function () {
  "use strict";

  var isDesktop = function () {
    return window.matchMedia("(min-width: 781px)").matches;
  };

  /* ---------- menu bar clock ---------- */
  var clockTime = document.querySelector(".clock .time");
  var clockDate = document.querySelector(".clock .date");
  function tick() {
    var now = new Date();
    if (clockTime) {
      clockTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit"
      });
    }
    if (clockDate) {
      clockDate.textContent = now.toLocaleDateString([], {
        weekday: "short", month: "short", day: "numeric"
      });
    }
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- window focus / stacking ---------- */
  var zTop = 30;
  function raise(win) {
    zTop += 1;
    win.style.zIndex = zTop;
  }

  function openWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    win.hidden = false;
    if (isDesktop()) {
      win.classList.add("is-opening");
      setTimeout(function () { win.classList.remove("is-opening"); }, 220);
    }
    raise(win);
    var title = win.querySelector(".titlebar .title");
    var focusTarget = win.querySelector(".winbtn.close") || win;
    focusTarget.focus({ preventScroll: !isDesktop() });
    if (!isDesktop()) win.scrollIntoView({ block: "start" });
    if (title) win.setAttribute("aria-label", title.textContent);
  }

  function closeWindow(win) {
    if (!isDesktop()) return; // windows are stacked cards on mobile
    win.hidden = true;
    var opener = document.querySelector('[data-window="' + win.id + '"]');
    if (opener) opener.focus();
  }

  /* icons + any element with data-window opens that window */
  document.querySelectorAll("[data-window]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openWindow(el.getAttribute("data-window"));
      // close the Work dropdown if open
      document.querySelectorAll(".menubar details[open]").forEach(function (d) {
        d.removeAttribute("open");
      });
    });
  });

  document.querySelectorAll(".window").forEach(function (win) {
    win.addEventListener("pointerdown", function () { raise(win); });
    var close = win.querySelector(".winbtn.close");
    if (close) {
      close.addEventListener("click", function () { closeWindow(win); });
    }
  });

  /* ESC closes the top-most visible window */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !isDesktop()) return;
    var wins = Array.prototype.filter.call(
      document.querySelectorAll(".window:not([hidden])"),
      function (w) { return w.querySelector(".winbtn.close"); }
    );
    if (!wins.length) return;
    wins.sort(function (a, b) {
      return (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0);
    });
    closeWindow(wins[0]);
  });

  /* ---------- dragging ---------- */
  document.querySelectorAll(".desktop .window .titlebar").forEach(function (bar) {
    var win = bar.closest(".window");
    bar.addEventListener("pointerdown", function (e) {
      if (!isDesktop()) return;
      if (e.target.closest(".winbtn")) return;
      e.preventDefault();
      raise(win);
      var startX = e.clientX, startY = e.clientY;
      var rect = win.getBoundingClientRect();
      var desk = win.offsetParent.getBoundingClientRect();
      var origL = rect.left - desk.left, origT = rect.top - desk.top;
      bar.setPointerCapture(e.pointerId);

      function move(ev) {
        var l = origL + (ev.clientX - startX);
        var t = origT + (ev.clientY - startY);
        l = Math.max(8 - rect.width * 0.7, Math.min(l, desk.width - 60));
        t = Math.max(0, Math.min(t, desk.height - 48));
        win.style.left = l + "px";
        win.style.top = t + "px";
        win.style.right = "auto";
      }
      function up() {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
      }
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
    });
  });

  /* ---------- Work dropdown: close on outside click ---------- */
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".menubar details[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });
})();
