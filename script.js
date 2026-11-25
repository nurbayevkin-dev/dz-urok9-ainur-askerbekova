(() => {
  "use strict";

  const STORAGE_KEY = "semya-spisok-items-v1";
  const FAMILY_STORAGE_KEY = "semya-spisok-family-v1";
  const typeNames = { film: "Фильм", book: "Книга", game: "Настольная игра" };
  const labels = { film: "Просмотрено", book: "Прочитано", game: "Играли" };
  const lists = { film: document.querySelector("#films"), book: document.querySelector("#books"), game: document.querySelector("#games") };
  const counts = { film: document.querySelector("#film-count"), book: document.querySelector("#book-count"), game: document.querySelector("#game-count") };
  const form = document.querySelector("#add-form");
  const titleInput = document.querySelector("#title");
  const typeInput = document.querySelector("#type");
  const hint = document.querySelector("#title-hint");
  const emptyState = document.querySelector("#empty-state");
  const familyForm = document.querySelector("#family-form");
  const familyNameInput = document.querySelector("#family-name");
  const familyHint = document.querySelector("#family-hint");
  const familyMembersList = document.querySelector("#family-members");
  const currentMemberSelect = document.querySelector("#current-member");
  function loadFamily() {
    try {
      const value = JSON.parse(localStorage.getItem(FAMILY_STORAGE_KEY) || "{}");
      const members = Array.isArray(value.members) ? value.members.filter((name) => typeof name === "string" && name.trim()) : [];
      return { members, selected: members.includes(value.selected) ? value.selected : (members[0] || "") };
    } catch {
      return { members: [], selected: "" };
    }
  }
  const family = loadFamily();
  let familyMembers = family.members;
  let selectedMember = family.selected;

  function saveFamily() {
    try {
      localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify({ members: familyMembers, selected: selectedMember }));
    } catch {
      familyHint.textContent = "Не удалось сохранить участников в браузере.";
    }
  }

  currentMemberSelect.addEventListener("change", () => {
    selectedMember = currentMemberSelect.value;
    saveFamily();
  });

  function renderFamilyMembers() {
    familyMembersList.replaceChildren();
    currentMemberSelect.replaceChildren();
    if (familyMembers.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Сначала добавьте участника";
      currentMemberSelect.append(option);
      currentMemberSelect.disabled = true;
    } else {
      currentMemberSelect.disabled = false;
      for (const name of familyMembers) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        option.selected = name === selectedMember;
        currentMemberSelect.append(option);
      }
    }
    for (const [index, name] of familyMembers.entries()) {
      const row = document.createElement("li");
      row.className = "family-member";
      const memberName = document.createElement("span");
      memberName.textContent = name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "member-delete-button";
      remove.textContent = "Удалить";
      remove.setAttribute("aria-label", `Удалить участника «${name}»`);
      remove.addEventListener("click", () => {
        if (!window.confirm(`Удалить участника «${name}»?`)) return;
        familyMembers.splice(index, 1);
        if (selectedMember === name) selectedMember = familyMembers[0] || "";
        saveFamily();
        renderFamilyMembers();
      });
      row.append(memberName, remove);
      familyMembersList.append(row);
    }
  }

  familyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = familyNameInput.value.trim();
    if (!name) {
      familyHint.textContent = "Введите имя участника.";
      familyNameInput.setAttribute("aria-invalid", "true");
      familyNameInput.focus();
      return;
    }
    if (familyMembers.some((member) => member.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))) {
      familyHint.textContent = "Такой участник уже есть.";
      familyNameInput.setAttribute("aria-invalid", "true");
      familyNameInput.focus();
      return;
    }
    familyMembers.push(name);
    if (!selectedMember) selectedMember = name;
    saveFamily();
    familyHint.textContent = "";
    familyNameInput.removeAttribute("aria-invalid");
    familyForm.reset();
    renderFamilyMembers();
    familyNameInput.focus();
  });

  familyNameInput.addEventListener("input", () => {
    if (familyNameInput.value.trim()) {
      familyHint.textContent = "";
      familyNameInput.removeAttribute("aria-invalid");
    }
  });

  function loadItems() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeNames[item.type])
        .map((item) => {
          const completed = item.completed === true || item.status === "done";
          return {
            id: item.id,
            title: item.title,
            type: item.type,
            completed,
            rating: completed && Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 ? item.rating : null
          };
        });
    } catch {
      return [];
    }
  }

  let items = loadItems();

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      hint.textContent = "Не удалось сохранить список в браузере.";
    }
  }

  function render() {
    for (const list of Object.values(lists)) list.replaceChildren();
    const grouped = { film: [], book: [], game: [] };
    for (const item of items) grouped[item.type].push(item);
    for (const type of Object.keys(grouped)) counts[type].textContent = String(grouped[type].length);
    emptyState.hidden = items.length > 0;

    for (const type of Object.keys(grouped)) {
      for (const item of grouped[type]) {
        const row = document.createElement("li");
        const card = document.createElement("article");
        card.className = "item-card";
        const title = document.createElement("h4");
        title.className = "item-title";
        title.textContent = item.title;
        const top = document.createElement("div");
        top.className = "item-top";
        top.append(title);

        const completionLabel = document.createElement("label");
        completionLabel.className = "completion-control";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;
        checkbox.setAttribute("aria-label", `${labels[type]}: ${item.title}`);
        checkbox.addEventListener("change", () => {
          item.completed = checkbox.checked;
          if (!item.completed) item.rating = null;
          saveItems();
          render();
        });
        completionLabel.append(checkbox);

        const rating = document.createElement("div");
        rating.className = `star-rating${item.completed ? " is-active" : " is-disabled"}`;
        rating.setAttribute("role", "group");
        rating.setAttribute("aria-label", `Оценка для «${item.title}»`);
        for (let star = 1; star <= 5; star += 1) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "star-button";
          button.textContent = star <= (item.rating || 0) ? "★" : "☆";
          button.disabled = !item.completed;
          button.setAttribute("aria-label", `${star} ${star === 1 ? "звезда" : star < 5 ? "звезды" : "звёзд"}`);
          button.setAttribute("aria-pressed", String(item.rating === star));
          button.addEventListener("click", () => {
            item.rating = star;
            saveItems();
            render();
          });
          rating.append(button);
        }
        const ratingView = document.createElement("span");
        ratingView.className = "rating-view";
        ratingView.textContent = item.rating === null ? "не оценено" : "";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-button";
        remove.textContent = "✕";
        remove.setAttribute("aria-label", `Удалить «${item.title}»`);
        remove.addEventListener("click", () => {
          if (!window.confirm("Удалить?")) return;
          items = items.filter((entry) => entry.id !== item.id);
          saveItems();
          render();
        });

        const controls = document.createElement("div");
        controls.className = "item-controls";
        controls.append(completionLabel, top, rating, ratingView, remove);
        card.append(controls);
        row.append(card);
        lists[type].append(row);
      }
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      hint.textContent = "Введите название, чтобы добавить запись.";
      titleInput.setAttribute("aria-invalid", "true");
      titleInput.focus();
      return;
    }
    const selectedType = typeInput.value;
    const normalizedTitle = title.toLocaleLowerCase("ru");
    if (items.some((item) => item.type === selectedType && item.title.trim().toLocaleLowerCase("ru") === normalizedTitle)) {
      hint.textContent = "Уже есть в списке";
      titleInput.removeAttribute("aria-invalid");
      titleInput.focus();
      return;
    }
    hint.textContent = "";
    titleInput.removeAttribute("aria-invalid");
    items.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, title, type: selectedType, completed: false, rating: null });
    saveItems();
    render();
    form.reset();
    titleInput.focus();
  });

  titleInput.addEventListener("input", () => {
    if (titleInput.value.trim()) {
      hint.textContent = "";
      titleInput.removeAttribute("aria-invalid");
    }
  });

  render();
  renderFamilyMembers();
})();
