const header = document.querySelector(".header");
const mainNavigation = document.querySelector(".main-navigation");
const menuIcon = document.querySelector(".menu-icon");
const closeMenuIcon = document.querySelector(".close-menu");
const backToTopButton = document.querySelector(".back-to-top");
const dropdownBtn = document.querySelector(".dropdown-btn");
const dropdownContent = document.querySelector(".dropdown-content");

let lastScrollTop = 0;

/* Header hide on scroll and back to top visibility */
window.addEventListener("scroll", () => {
  const currentScroll =
    window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop) {
    header.style.top = "-100%";
    mainNavigation.classList.add("fixed");
  } else {
    header.style.top = "0";
    mainNavigation.classList.remove("fixed");
  }
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

  if (currentScroll > 400) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
});

/* Helper to close mobile menu */
function closeMobileMenu() {
  mainNavigation.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* Mobile nav toggle on hamburger */
menuIcon.addEventListener("click", () => {
  if (mainNavigation.classList.contains("open")) {
    closeMobileMenu();
  } else {
    mainNavigation.classList.add("open");
    document.body.classList.add("no-scroll");
  }
});

/* Close mobile menu on X */
closeMenuIcon.addEventListener("click", closeMobileMenu);

/* Close when tapping outside the menu */
document.addEventListener("click", (event) => {
  const clickedInside =
    mainNavigation.contains(event.target) || menuIcon.contains(event.target);
  if (!clickedInside && mainNavigation.classList.contains("open")) {
    closeMobileMenu();
  }
});

/* Close mobile menu only when clicking leaf links (no submenu under them) */
document.querySelectorAll(".main-navigation a").forEach((link) => {
  link.addEventListener("click", (event) => {
    // parent wrapper that might hold a submenu or sub-links
    const parent = link.parentElement;
    const hasSubMenu =
      parent.querySelector(".submenu") || parent.querySelector(".sub-links");

    // if this link controls a submenu, let the submenu logic handle it
    if (hasSubMenu) {
      return;
    }

    // for normal links on small screens, close the menu
    if (window.innerWidth <= 900 && mainNavigation.classList.contains("open")) {
      closeMobileMenu();
    }
  });
});

/* Smooth submenu for main categories */
document.querySelectorAll(".menu-item > a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const parent = link.parentElement;
    const panel = parent.querySelector(".submenu");
    if (!panel) return;

    event.preventDefault();

    // close others
    document.querySelectorAll(".submenu").forEach((other) => {
      if (other !== panel) {
        if (!other.parentElement.classList.contains("open")) return;
        
        other.style.maxHeight = other.scrollHeight + "px";
        other.parentElement.classList.remove("open");
        
        requestAnimationFrame(() => {
          other.style.maxHeight = "0px";
        });
      }
    });

    const isOpen = parent.classList.contains("open");

    if (isOpen) {
      // closing
      panel.style.maxHeight = panel.scrollHeight + "px";
      parent.classList.remove("open");
      
      requestAnimationFrame(() => {
        panel.style.maxHeight = "0px";
      });
    } else {
      // opening
      panel.style.maxHeight = panel.scrollHeight + "px";
      parent.classList.add("open");

      panel.addEventListener("transitionend", () => {
        if (parent.classList.contains("open")) {
          panel.style.maxHeight = "none";
        }
      }, { once: true });
    }
  });
});



/* Smooth submenu for Era lists */
document.querySelectorAll(".submenu-item > a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const parent = link.parentElement;
    const panel = parent.querySelector(".sub-links");
    if (!panel) return;

    event.preventDefault();

    // close others
    document.querySelectorAll(".sub-links").forEach((other) => {
      if (other !== panel) {
        if (!other.parentElement.classList.contains("open")) return;
        
        other.style.maxHeight = other.scrollHeight + "px";
        other.parentElement.classList.remove("open");
        
        requestAnimationFrame(() => {
          other.style.maxHeight = "0px";
        });
      }
    });

    const isOpen = parent.classList.contains("open");

    if (isOpen) {
      // closing
      panel.style.maxHeight = panel.scrollHeight + "px";
      parent.classList.remove("open");
      
      requestAnimationFrame(() => {
        panel.style.maxHeight = "0px";
      });
    } else {
      // opening
      panel.style.maxHeight = panel.scrollHeight + "px";
      parent.classList.add("open");

      panel.addEventListener("transitionend", () => {
        if (parent.classList.contains("open")) {
          panel.style.maxHeight = "none";
        }
      }, { once: true });
    }
  });
});




/* Local sub nav on smaller screens */
if (dropdownBtn) {
  dropdownBtn.addEventListener("click", () => {
    dropdownContent.classList.toggle("show");
  });
}

document
  .querySelectorAll(".dropdown-content a")
  .forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      if (dropdownContent.classList.contains("show")) {
        dropdownContent.classList.remove("show");
      }
    });
  });

/* Back to top */
backToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* Lightbox helper */
function initLightbox(triggerSelector, lightboxId, imgId) {
  const triggers = Array.from(
    document.querySelectorAll(triggerSelector)
  );
  if (!triggers.length) return;

  const lightbox = document.getElementById(lightboxId);
  const imgElement = document.getElementById(imgId);
  const close = lightbox.querySelector(".close");
  const prev = lightbox.querySelector(".nav-arrow.left");
  const next = lightbox.querySelector(".nav-arrow.right");

  let index = 0;

  function showSlide(i) {
    if (i < 0) i = triggers.length - 1;
    if (i >= triggers.length) i = 0;
    index = i;
    const src = triggers[i].getAttribute("href");
    imgElement.src = src;
  }

  triggers.forEach((el, i) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      index = i;
      showSlide(index);
      lightbox.style.display = "block";
    });
  });

  close.addEventListener("click", () => {
    lightbox.style.display = "none";
  });

  prev.addEventListener("click", () => {
    showSlide(index - 1);
  });

  next.addEventListener("click", () => {
    showSlide(index + 1);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.style.display = "none";
    }
  });
}

initLightbox(".lightbox-trigger.masonry", "lightbox-masonry", "lightbox-img-masonry");
initLightbox(".lightbox-trigger.flex", "lightbox-flex", "lightbox-img-flex");