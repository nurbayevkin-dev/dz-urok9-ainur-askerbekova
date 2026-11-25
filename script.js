(() => {
  "use strict";

  const STORAGE_KEY = "semya-spisok-items-v1";
  const typeNames = { film: "Фильм", book: "Книга", game: "Настольная игра" };
  const labels = { film: "Просмотрено", book: "Прочитано", game: "Играли" };
  const lists = { film: document.querySelector("#films"), book: document.querySelector("#books"), game: document.querySelector("#games") };
  const counts = { film: document.querySelector("#film-count"), book: document.querySelector("#book-count"), game: document.querySelector("#game-count") };
  const form = document.querySelector("#add-form");
  const titleInput = document.querySelector("#title");
  const typeInput = document.querySelector("#type");
  const hint = document.querySelector("#title-hint");
  const emptyState = document.querySelector("#empty-state");

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
        const typeLabel = document.createElement("span");
        typeLabel.className = "type-label";
        typeLabel.textContent = typeNames[type];
        const top = document.createElement("div");
        top.className = "item-top";
        top.append(title, typeLabel);

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
        completionLabel.append(checkbox, document.createTextNode(labels[type]));

        const ratingLabel = document.createElement("label");
        ratingLabel.className = "control-label";
        ratingLabel.textContent = "Оценка";
        const rating = document.createElement("select");
        rating.setAttribute("aria-label", `Оценка: ${item.title}`);
        rating.disabled = !item.completed;
        const none = document.createElement("option");
        none.value = "";
        none.textContent = "Не оценено";
        none.selected = item.rating === null;
        rating.append(none);
        for (let star = 1; star <= 5; star += 1) {
          const option = document.createElement("option");
          option.value = String(star);
          option.textContent = `${star} ${star === 1 ? "звезда" : star < 5 ? "звезды" : "звёзд"}`;
          option.selected = item.rating === star;
          rating.append(option);
        }
        rating.addEventListener("change", () => {
          item.rating = rating.value ? Number(rating.value) : null;
          saveItems();
          render();
        });
        const ratingView = document.createElement("p");
        ratingView.className = "rating-view";
        if (item.rating === null) ratingView.textContent = "не оценено";
        else {
          const stars = document.createElement("span");
          stars.className = "stars";
          stars.setAttribute("aria-label", `${item.rating} из 5 звёзд`);
          stars.textContent = "★".repeat(item.rating) + "☆".repeat(5 - item.rating);
          ratingView.append(stars);
        }

        const controls = document.createElement("div");
        controls.className = "item-controls";
        const ratingGroup = document.createElement("div");
        ratingGroup.className = "control-group";
        ratingGroup.append(ratingLabel, rating, ratingView);
        controls.append(completionLabel, ratingGroup);
        card.append(top, controls);
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
    hint.textContent = "";
    titleInput.removeAttribute("aria-invalid");
    items.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, title, type: typeInput.value, completed: false, rating: null });
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
})();
