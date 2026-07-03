const skillText = {
  analysis: "当前重点：把信息、数据和需求整理成清楚的判断，并转化成可执行方案。",
  delivery: "当前重点：把任务拆成步骤，明确输入、输出和验收结果，稳定推进交付。",
  communication: "当前重点：把复杂内容讲清楚，让不同背景的人都能快速理解重点。",
};

const EDIT_STORAGE_KEY = "personalResumeEditableContent";
const PHOTO_STORAGE_KEY = "personalResumePhoto";
const PUBLISHED_PHOTO_SRC = "./assets/profile-photo.jpg";
const editableSelectors = [
  ".brand",
  ".hero-copy h1",
  ".role",
  ".lead",
  ".photo-note",
  ".quick-info dd",
  ".stats strong",
  ".stats span",
  ".stats-feedback",
  ".section-label",
  ".section h2",
  ".section-text p",
  "[data-skill-summary]",
  ".panel h3",
  ".panel p",
  ".tags span",
  ".timeline-item > span",
  ".timeline-item h3",
  ".timeline-item > p:not(.details)",
  ".timeline-item .details",
  ".project-meta",
  ".project h3",
  ".project p",
  ".contact-panel a",
  ".footer span",
];
const editableItems = [...document.querySelectorAll(editableSelectors.join(","))];
const originalEditableText = new Map();
const originalEditableFontSize = new Map();
const editableLayouts = {};
let activeEditableItem = null;
let activePointerAction = null;

const navLinks = [...document.querySelectorAll(".nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

editableItems.forEach((item, index) => {
  item.dataset.editKey = item.dataset.editKey || `field-${index}`;
  item.classList.add("editable-box");
  originalEditableText.set(item.dataset.editKey, item.textContent);
  originalEditableFontSize.set(item.dataset.editKey, item.style.fontSize || "");
});

const readSavedEdits = () => {
  const saved = localStorage.getItem(EDIT_STORAGE_KEY);
  return saved ? JSON.parse(saved) : {};
};

const updateDerivedFields = () => {
  const name = document.querySelector(".hero-copy h1")?.textContent.trim();
  if (name) {
    document.title = `${name} | 个人简历`;
  }

  const emailLink = [...document.querySelectorAll(".contact-panel a")].find((link) =>
    link.textContent.includes("@"),
  );
  const email = emailLink?.textContent.trim();
  const copyButton = document.querySelector("[data-copy-email]");
  if (emailLink && email) {
    emailLink.href = `mailto:${email}`;
  }
  if (copyButton && email) {
    copyButton.dataset.copyEmail = email;
  }
};

const getDefaultLayout = () => ({ x: 0, y: 0, width: null, height: null });

const applyEditableLayout = (item) => {
  const layout = editableLayouts[item.dataset.editKey] || getDefaultLayout();
  item.style.setProperty("--edit-x", `${layout.x}px`);
  item.style.setProperty("--edit-y", `${layout.y}px`);
  if (Number.isFinite(layout.width)) {
    item.style.width = `${layout.width}px`;
  } else {
    item.style.removeProperty("width");
  }
  if (Number.isFinite(layout.height)) {
    item.style.minHeight = `${layout.height}px`;
  } else {
    item.style.removeProperty("min-height");
  }
  item.toggleAttribute(
    "data-layout-active",
    layout.x !== 0 || layout.y !== 0 || Number.isFinite(layout.width) || Number.isFinite(layout.height),
  );
};

const updateEditBoxControls = () => {
  const controls = document.querySelector("[data-edit-box-controls]");
  if (!controls) return;
  if (!document.body.classList.contains("editing-content") || !activeEditableItem) {
    controls.hidden = true;
    return;
  }

  const rect = activeEditableItem.getBoundingClientRect();
  controls.hidden = false;
  controls.style.left = `${rect.left + window.scrollX}px`;
  controls.style.top = `${rect.top + window.scrollY}px`;
  controls.style.width = `${Math.max(44, rect.width)}px`;
  controls.style.height = `${Math.max(28, rect.height)}px`;
};

const setPhotoPreview = (src, message) => {
  const preview = document.querySelector("[data-photo-preview]");
  const placeholder = document.querySelector("[data-photo-placeholder]");
  const note = document.querySelector("[data-photo-note]");
  if (!preview || !placeholder || !note) return;

  preview.src = src;
  preview.hidden = false;
  placeholder.hidden = true;
  note.textContent = message;
};

const applySavedPhoto = () => {
  const savedPhoto = localStorage.getItem(PHOTO_STORAGE_KEY);
  if (savedPhoto) {
    setPhotoPreview(savedPhoto, "相片已保存，刷新页面后仍会显示。");
  }
};

const applyPublishedPhoto = () => {
  if (localStorage.getItem(PHOTO_STORAGE_KEY)) return;

  const image = new Image();
  image.addEventListener("load", () => {
    setPhotoPreview(PUBLISHED_PHOTO_SRC, "相片已发布到网站，其他设备也能看到。");
  });
  image.src = `${PUBLISHED_PHOTO_SRC}?v=1`;
};

const compressPhoto = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });

const applySavedEdits = () => {
  const saved = readSavedEdits();
  const savedFontSizes = saved.fontSizes || {};
  Object.assign(editableLayouts, saved.layouts || {});
  Object.keys(skillText).forEach((key) => {
    const savedSkillText = saved[`skill-${key}`];
    if (typeof savedSkillText === "string") {
      skillText[key] = savedSkillText;
    }
  });
  editableItems.forEach((item) => {
    const value = saved[item.dataset.editKey];
    if (typeof value === "string") {
      item.textContent = value;
    }
    const fontSize = savedFontSizes[item.dataset.editKey];
    if (typeof fontSize === "string") {
      item.style.fontSize = fontSize;
    }
    applyEditableLayout(item);
  });
  updateDerivedFields();
};

const setActiveEditableItem = (item) => {
  activeEditableItem?.removeAttribute("data-selected-editable");
  activeEditableItem = item;
  activeEditableItem?.setAttribute("data-selected-editable", "");
  updateEditBoxControls();
};

const shouldSkipBoxMove = (event, item) =>
  event.target.closest("[data-edit-box-controls]") ||
  event.target !== item ||
  event.button !== 0 ||
  event.detail > 1;

const setEditing = (enabled) => {
  document.body.classList.toggle("editing-content", enabled);
  document.querySelector("[data-edit-toggle]").textContent = enabled ? "退出编辑" : "编辑资料";
  document.querySelector("[data-edit-save]").hidden = !enabled;
  document.querySelector("[data-edit-reset]").hidden = !enabled;
  document.querySelector("[data-font-smaller]").hidden = !enabled;
  document.querySelector("[data-font-larger]").hidden = !enabled;

  editableItems.forEach((item) => {
    item.setAttribute("contenteditable", enabled ? "plaintext-only" : "false");
    item.toggleAttribute("spellcheck", enabled);
    if (enabled) {
      item.dataset.editableActive = "";
    } else {
      delete item.dataset.editableActive;
    }
  });
  if (!enabled) {
    setActiveEditableItem(null);
  }
  updateEditBoxControls();
};

const saveEdits = () => {
  const next = {};
  const fontSizes = {};
  const activeSkill = document.querySelector("[data-skill-tab].active")?.dataset.skillTab;
  if (activeSkill) {
    skillText[activeSkill] = document.querySelector("[data-skill-summary]").textContent.trim();
  }
  editableItems.forEach((item) => {
    next[item.dataset.editKey] = item.textContent.trim();
    if (item.style.fontSize) {
      fontSizes[item.dataset.editKey] = item.style.fontSize;
    }
  });
  Object.keys(skillText).forEach((key) => {
    next[`skill-${key}`] = skillText[key];
  });
  next.fontSizes = fontSizes;
  next.layouts = editableLayouts;
  localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(next));
  updateDerivedFields();

  const saveButton = document.querySelector("[data-edit-save]");
  saveButton.textContent = "已保存";
  window.setTimeout(() => {
    saveButton.textContent = "保存";
  }, 1100);
};

applySavedEdits();
applySavedPhoto();
applyPublishedPhoto();

document.querySelector("[data-edit-toggle]")?.addEventListener("click", () => {
  setEditing(!document.body.classList.contains("editing-content"));
});

document.querySelector("[data-edit-save]")?.addEventListener("click", saveEdits);

document.querySelector("[data-edit-reset]")?.addEventListener("click", () => {
  localStorage.removeItem(EDIT_STORAGE_KEY);
  localStorage.removeItem(PHOTO_STORAGE_KEY);
  skillText.analysis = "当前重点：把信息、数据和需求整理成清楚的判断，并转化成可执行方案。";
  skillText.delivery = "当前重点：把任务拆成步骤，明确输入、输出和验收结果，稳定推进交付。";
  skillText.communication = "当前重点：把复杂内容讲清楚，让不同背景的人都能快速理解重点。";
  document.querySelectorAll("[data-skill-tab]").forEach((item) => item.classList.remove("active"));
  document.querySelector('[data-skill-tab="analysis"]')?.classList.add("active");
  editableItems.forEach((item) => {
    item.textContent = originalEditableText.get(item.dataset.editKey);
    item.style.fontSize = originalEditableFontSize.get(item.dataset.editKey);
    delete editableLayouts[item.dataset.editKey];
    applyEditableLayout(item);
  });
  const preview = document.querySelector("[data-photo-preview]");
  const placeholder = document.querySelector("[data-photo-placeholder]");
  const note = document.querySelector("[data-photo-note]");
  if (preview && placeholder && note) {
    preview.removeAttribute("src");
    preview.hidden = true;
    placeholder.hidden = false;
    note.textContent = "推荐使用正面职业照或生活照。";
  }
  updateDerivedFields();
  updateEditBoxControls();
});

editableItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    if (document.body.classList.contains("editing-content")) {
      event.stopPropagation();
      setActiveEditableItem(item);
      if (item.tagName === "A") {
        event.preventDefault();
      }
    }
  });
  item.addEventListener("pointerdown", (event) => {
    if (!document.body.classList.contains("editing-content") || shouldSkipBoxMove(event, item)) return;
    setActiveEditableItem(item);
    startPointerAction(event, "move", item);
  });
  item.addEventListener("focus", () => {
    if (document.body.classList.contains("editing-content")) {
      setActiveEditableItem(item);
    }
  });
});

const startPointerAction = (event, mode, item = activeEditableItem) => {
  if (!item) return;
  const key = item.dataset.editKey;
  const layout = editableLayouts[key] || getDefaultLayout();
  const rect = item.getBoundingClientRect();
  activePointerAction = {
    key,
    item,
    mode,
    startX: event.clientX,
    startY: event.clientY,
    x: layout.x,
    y: layout.y,
    width: Number.isFinite(layout.width) ? layout.width : rect.width,
    height: Number.isFinite(layout.height) ? layout.height : rect.height,
    moved: false,
  };
  document.body.dataset.editPointerActive = mode;
  window.addEventListener("pointermove", handlePointerAction);
  window.addEventListener("pointerup", stopPointerAction, { once: true });
};

const handlePointerAction = (event) => {
  if (!activePointerAction) return;
  const dx = event.clientX - activePointerAction.startX;
  const dy = event.clientY - activePointerAction.startY;
  if (!activePointerAction.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
  event.preventDefault();
  activePointerAction.moved = true;
  const next = editableLayouts[activePointerAction.key] || getDefaultLayout();

  if (activePointerAction.mode === "move") {
    next.x = Math.round(activePointerAction.x + dx);
    next.y = Math.round(activePointerAction.y + dy);
  } else {
    next.width = Math.max(36, Math.round(activePointerAction.width + dx));
    next.height = Math.max(24, Math.round(activePointerAction.height + dy));
  }

  editableLayouts[activePointerAction.key] = next;
  applyEditableLayout(activePointerAction.item);
  updateEditBoxControls();
};

const stopPointerAction = () => {
  window.removeEventListener("pointermove", handlePointerAction);
  document.body.removeAttribute("data-edit-pointer-active");
  activePointerAction = null;
  updateEditBoxControls();
};

document.querySelector("[data-edit-box-resize]")?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startPointerAction(event, "resize");
});

document.querySelector("[data-edit-box-reset]")?.addEventListener("click", () => {
  if (!activeEditableItem) return;
  delete editableLayouts[activeEditableItem.dataset.editKey];
  applyEditableLayout(activeEditableItem);
  updateEditBoxControls();
});

document.querySelector("[data-font-smaller]")?.addEventListener("click", () => {
  if (!activeEditableItem) return;
  const current = Number.parseFloat(getComputedStyle(activeEditableItem).fontSize);
  activeEditableItem.style.fontSize = `${Math.max(11, current - 2)}px`;
  updateEditBoxControls();
});

document.querySelector("[data-font-larger]")?.addEventListener("click", () => {
  if (!activeEditableItem) return;
  const current = Number.parseFloat(getComputedStyle(activeEditableItem).fontSize);
  activeEditableItem.style.fontSize = `${Math.min(160, current + 2)}px`;
  updateEditBoxControls();
});

document.querySelector("[data-photo-input]")?.addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;

  const photoData = await compressPhoto(file);
  localStorage.setItem(PHOTO_STORAGE_KEY, photoData);
  setPhotoPreview(photoData, "相片已保存，刷新页面后仍会显示。");
});

document.querySelectorAll("[data-stat-message]").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelector("[data-stats-feedback]").textContent = item.dataset.statMessage;
  });
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      item.click();
    }
  });
});

document.querySelectorAll("[data-skill-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-skill-tab]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector("[data-skill-summary]").textContent = skillText[button.dataset.skillTab];
  });
});

document.querySelectorAll("[data-toggle-details]").forEach((button) => {
  button.addEventListener("click", () => {
    const detail = button.nextElementSibling;
    const isHidden = detail.hidden;
    detail.hidden = !isHidden;
    button.textContent = isHidden ? "收起详情" : "展开详情";
  });
});

document.querySelectorAll("[data-project-more]").forEach((button) => {
  button.addEventListener("click", () => {
    const detail = button.closest(".project").querySelector(".project-detail");
    const isHidden = detail.hidden;
    detail.hidden = !isHidden;
    button.textContent = isHidden ? "收起亮点" : "展开亮点";
  });
});

document.querySelector("[data-pulse-card]")?.addEventListener("click", (event) => {
  const card = event.currentTarget.closest(".resume-card");
  card.classList.add("is-pulsing");
  event.currentTarget.textContent = "摘要已高亮";
  window.setTimeout(() => card.classList.remove("is-pulsing"), 900);
});

document.querySelector("[data-copy-email]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const email = button.dataset.copyEmail;
  try {
    await navigator.clipboard.writeText(email);
    button.textContent = "已复制";
  } catch {
    button.textContent = "复制失败";
  }
  window.setTimeout(() => {
    button.textContent = "复制邮箱";
  }, 1200);
});

document.querySelector("[data-back-top]")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const backTop = document.querySelector("[data-back-top]");
const updateBackTop = () => {
  backTop?.classList.toggle("visible", window.scrollY > 520);
};

const setActiveNav = () => {
  let currentId = sections[0]?.id;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top < 140) {
      currentId = section.id;
    }
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
  });
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.14 },
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));
window.addEventListener("scroll", () => {
  updateBackTop();
  setActiveNav();
  updateEditBoxControls();
});
window.addEventListener("resize", updateEditBoxControls);
updateBackTop();
setActiveNav();
