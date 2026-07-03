const skillText = {
  analysis: "当前重点：把信息、数据和需求整理成清楚的判断，并转化成可执行方案。",
  delivery: "当前重点：把任务拆成步骤，明确输入、输出和验收结果，稳定推进交付。",
  communication: "当前重点：把复杂内容讲清楚，让不同背景的人都能快速理解重点。",
};

const EDIT_STORAGE_KEY = "personalResumeEditableContent";
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

const navLinks = [...document.querySelectorAll(".nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

editableItems.forEach((item, index) => {
  item.dataset.editKey = item.dataset.editKey || `field-${index}`;
  originalEditableText.set(item.dataset.editKey, item.textContent);
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

const applySavedEdits = () => {
  const saved = readSavedEdits();
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
  });
  updateDerivedFields();
};

const setEditing = (enabled) => {
  document.body.classList.toggle("editing-content", enabled);
  document.querySelector("[data-edit-toggle]").textContent = enabled ? "退出编辑" : "编辑资料";
  document.querySelector("[data-edit-save]").hidden = !enabled;
  document.querySelector("[data-edit-reset]").hidden = !enabled;

  editableItems.forEach((item) => {
    item.setAttribute("contenteditable", enabled ? "plaintext-only" : "false");
    item.toggleAttribute("spellcheck", enabled);
    if (enabled) {
      item.dataset.editableActive = "";
    } else {
      delete item.dataset.editableActive;
    }
  });
};

const saveEdits = () => {
  const next = {};
  const activeSkill = document.querySelector("[data-skill-tab].active")?.dataset.skillTab;
  if (activeSkill) {
    skillText[activeSkill] = document.querySelector("[data-skill-summary]").textContent.trim();
  }
  editableItems.forEach((item) => {
    next[item.dataset.editKey] = item.textContent.trim();
  });
  Object.keys(skillText).forEach((key) => {
    next[`skill-${key}`] = skillText[key];
  });
  localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(next));
  updateDerivedFields();

  const saveButton = document.querySelector("[data-edit-save]");
  saveButton.textContent = "已保存";
  window.setTimeout(() => {
    saveButton.textContent = "保存";
  }, 1100);
};

applySavedEdits();

document.querySelector("[data-edit-toggle]")?.addEventListener("click", () => {
  setEditing(!document.body.classList.contains("editing-content"));
});

document.querySelector("[data-edit-save]")?.addEventListener("click", saveEdits);

document.querySelector("[data-edit-reset]")?.addEventListener("click", () => {
  localStorage.removeItem(EDIT_STORAGE_KEY);
  skillText.analysis = "当前重点：把信息、数据和需求整理成清楚的判断，并转化成可执行方案。";
  skillText.delivery = "当前重点：把任务拆成步骤，明确输入、输出和验收结果，稳定推进交付。";
  skillText.communication = "当前重点：把复杂内容讲清楚，让不同背景的人都能快速理解重点。";
  document.querySelectorAll("[data-skill-tab]").forEach((item) => item.classList.remove("active"));
  document.querySelector('[data-skill-tab="analysis"]')?.classList.add("active");
  editableItems.forEach((item) => {
    item.textContent = originalEditableText.get(item.dataset.editKey);
  });
  updateDerivedFields();
});

editableItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    if (document.body.classList.contains("editing-content")) {
      event.stopPropagation();
      if (item.tagName === "A") {
        event.preventDefault();
      }
    }
  });
});

document.querySelector("[data-interview-mode]")?.addEventListener("click", (event) => {
  const enabled = document.body.classList.toggle("interview-mode");
  event.currentTarget.textContent = enabled ? "退出面试官视角" : "面试官视角";
});

document.querySelector("[data-photo-input]")?.addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;

  const preview = document.querySelector("[data-photo-preview]");
  const placeholder = document.querySelector("[data-photo-placeholder]");
  const note = document.querySelector("[data-photo-note]");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  placeholder.hidden = true;
  note.textContent = "相片已加载为本地预览，刷新页面后需要重新选择。";
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
});
updateBackTop();
setActiveNav();
