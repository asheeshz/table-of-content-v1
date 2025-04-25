  document.addEventListener("DOMContentLoaded", function () {
  // --- Configuration ---
  const config = {
    postContainerSelector: ".post-body", // *** महत्वपूर्ण: इसे अपनी थीम के अनुसार बदलें ***
    headingsSelector: "h2, h3",
    minHeadingsForToc: 2,
    tocTitleText: "Table of Contents", // <<<--- अपना पसंदीदा अंग्रेजी शीर्षक डालें
    showButtonBaseText: "Explore Topics", // <<<--- केवल बेस टेक्स्ट डालें
    hideButtonBaseText: "Hide Contents", // <<<--- केवल बेस टेक्स्ट डालें
    showIconClass: "fa-solid fa-chevron-down", // <<<--- दिखाने के लिए आइकन क्लास (v6)
    hideIconClass: "fa-solid fa-chevron-up",   // <<<--- छिपाने के लिए आइकन क्लास (v6)
    highlightDuration: 3000,
    useIcons: true, // TOC लिंक्स के लिए आइकन
    h2IconClass: "fa-solid fa-book-reader", // <<<--- अपना H2 आइकन डालें (v6)
    h3IconClass: "fa-regular fa-circle",   // <<<--- अपना H3 आइकन डालें (v6)
  };
  // --- End Configuration ---

  let currentHighlightTimeout = null;
  let tocContainer = null;
  let toc = null;
  let toggleButton = null;

  function createSafeId(heading, index) {
    let textForId = (heading.textContent || '').trim().toLowerCase();
    let baseId = textForId.replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
    let id = "toc-h-" + (baseId || index);
    let counter = 1; const originalId = id;
    while (document.getElementById(id)) { id = originalId + '-' + counter; counter++; }
    return id;
  }

  function clearHighlights(specificHeading = null, specificContent = []) {
    if (currentHighlightTimeout) { clearTimeout(currentHighlightTimeout); currentHighlightTimeout = null; }
    if (specificHeading) { specificHeading.classList.remove('highlight-target'); }
    if (specificContent.length > 0) { specificContent.forEach(el => el.classList.remove('highlight-content')); }
    else if (!specificHeading && !specificContent.length) {
      document.querySelectorAll('.highlight-target').forEach(el => el.classList.remove('highlight-target'));
      document.querySelectorAll('.highlight-content').forEach(el => el.classList.remove('highlight-content'));
    }
  }

  function applyHighlight(targetHeading) {
    clearHighlights();
    targetHeading.classList.add('highlight-target');
    const highlightedContent = [];
    let sibling = targetHeading.nextElementSibling;
    while (sibling && !sibling.matches(config.headingsSelector) && !sibling.matches('#toc-container')) {
      if (sibling.nodeType === 1) { sibling.classList.add('highlight-content'); highlightedContent.push(sibling); }
      sibling = sibling.nextElementSibling;
    }
    currentHighlightTimeout = setTimeout(() => { clearHighlights(targetHeading, highlightedContent); }, config.highlightDuration);
  }

  function smoothScrollToTarget(element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offset = window.innerHeight * 0.28;
    const targetScrollPosition = absoluteElementTop - offset;
    window.scrollTo({ top: targetScrollPosition });
  }

  function controlButtonGlow(buttonElement, shouldGlow) {
      if (!buttonElement) return;
      if (shouldGlow) {
          setTimeout(() => {
              if (!toc?.classList.contains('toc-visible')) {
                   buttonElement.classList.add('toc-closed-effect');
              }
          }, 700);
      } else {
          buttonElement.classList.remove('toc-closed-effect');
      }
  }

  /**
   * बटन का टेक्स्ट और आइकन अपडेट करता है।
   * @param {boolean} isExpanded - क्या TOC खुला हुआ है?
   */
  function updateButtonContent(isExpanded) {
      if (!toggleButton) return;
      const text = isExpanded ? config.hideButtonBaseText : config.showButtonBaseText;
      const iconClass = isExpanded ? config.hideIconClass : config.showIconClass;
      // innerHTML का उपयोग करके टेक्स्ट और आइकन दोनों सेट करें
      toggleButton.innerHTML = `${text} <i class="${iconClass}" aria-hidden="true" style="margin-left: 8px;"></i>`;
      toggleButton.setAttribute('aria-expanded', String(isExpanded));
  }


  function initializeToc() {
    const postContent = document.querySelector(config.postContainerSelector);
    if (!postContent) { console.warn("TOC: Container '" + config.postContainerSelector + "' not found."); return; }

    const headings = Array.from(postContent.querySelectorAll(config.headingsSelector));
    const validHeadings = [];
    let firstValidHeading = null;

    headings.forEach(heading => {
      if (!heading.closest('#toc-container') && heading.textContent.trim()) {
        validHeadings.push(heading);
        if (!firstValidHeading) firstValidHeading = heading;
      }
    });

    if (validHeadings.length < config.minHeadingsForToc) return;

    tocContainer = document.createElement("div"); tocContainer.id = "toc-container";
    toggleButton = document.createElement("button"); toggleButton.id = "toc-toggle-button";
    // प्रारंभिक बटन टेक्स्ट और आइकन सेट करें
    updateButtonContent(false); // शुरुआत में बंद (false)
    toggleButton.setAttribute("aria-controls", "toc");
    controlButtonGlow(toggleButton, true);

    toc = document.createElement("div"); toc.id = "toc";
    const tocTitle = document.createElement("h2");
    tocTitle.textContent = config.tocTitleText;
    toc.appendChild(tocTitle);
    const tocList = document.createElement("ul");

    validHeadings.forEach((heading, index) => {
      let id = heading.getAttribute("id");
      if (!id) { id = createSafeId(heading, index); heading.setAttribute("id", id); }
      const listItem = document.createElement("li");
      const headingLevel = heading.tagName.toLowerCase();
      listItem.classList.add('toc-level-' + headingLevel.replace('h',''));
      const link = document.createElement("a"); link.setAttribute("href", "#" + id);

      let iconClass = "";
      if (config.useIcons) {
        if (headingLevel === 'h2' && config.h2IconClass) iconClass = config.h2IconClass;
        else if (headingLevel === 'h3' && config.h3IconClass) iconClass = config.h3IconClass;
        if (iconClass) {
          const iconElement = document.createElement("i");
          iconClass.split(' ').forEach(cls => { if (cls) iconElement.classList.add(cls); });
          iconElement.setAttribute("aria-hidden", "true");
          link.appendChild(iconElement);
        }
      }
      link.appendChild(document.createTextNode((heading.textContent || '').trim()));
      listItem.appendChild(link); tocList.appendChild(listItem);
    });

    toc.appendChild(tocList); tocContainer.appendChild(toggleButton); tocContainer.appendChild(toc);

    if (firstValidHeading?.parentNode) { firstValidHeading.parentNode.insertBefore(tocContainer, firstValidHeading); }
    else if (postContent.firstChild) { postContent.insertBefore(tocContainer, postContent.firstChild); }
    else { postContent.appendChild(tocContainer); }

    setupEventListeners();
  }

  function setupEventListeners() {
    if (!tocContainer || !toc || !toggleButton) return;

    toggleButton.addEventListener('click', () => {
      const isExpanded = toc.classList.toggle('toc-visible');
      // बटन टेक्स्ट और आइकन अपडेट करें
      updateButtonContent(isExpanded);
      tocContainer.classList.toggle('toc-is-shown', isExpanded);
      controlButtonGlow(toggleButton, !isExpanded); // ग्लो नियंत्रित करें
    });

    toc.addEventListener('click', (event) => {
      const linkElement = event.target.closest('a');
      if (linkElement && linkElement.getAttribute('href').startsWith('#')) {
        event.preventDefault();
        const targetId = linkElement.getAttribute('href').substring(1);
        const targetHeading = document.getElementById(targetId);
        if (targetHeading) {
           if (!toc.classList.contains('toc-visible')) {
               // बटन क्लिक को सिमुलेट करने से पहले स्थिति जांचें
               const isCurrentlyExpanded = toc.classList.contains('toc-visible');
               updateButtonContent(!isCurrentlyExpanded); // मैन्युअली स्थिति अपडेट करें
               toc.classList.add('toc-visible'); // मैन्युअली खोलें
               tocContainer.classList.add('toc-is-shown');
               controlButtonGlow(toggleButton, false); // ग्लो बंद करें
           }
           smoothScrollToTarget(targetHeading);
           setTimeout(() => { applyHighlight(targetHeading); }, 500);
        } else { console.warn("TOC: Target '" + targetId + "' not found."); }
      }
    });
  }

  try { initializeToc(); }
  catch (error) { console.error("TOC Script Error:", error); }
});
