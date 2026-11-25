(() => {
  "use strict";

  const STORAGE_KEY = "semya-spisok-items-v1";
  const typeNames = { film: "Фильм", book: "Книга", game: "Настольная игра" };
  const form = document.querySelector("#add-form");
  const titleInput = document.querySelector("#title");
  const typeInput = document.querySelector("#type");
  const hint = document.querySelector("#title-hint");
  const list = document.querySelector("#items");
  const emptyState = document.querySelector("#empty-state");
  const count = document.querySelector("#item-count");

  function loadItems() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeNames[item.type])
        .map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status === "done" ? "done" : "want",
          rating: Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 ? item.rating : null
        }));
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

  function makeOption(value, label, selected) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = selected;
    return option;
  }

  function render() {
    list.replaceChildren();
    emptyState.hidden = items.length > 0;
    count.textContent = items.length ? `${items.length} ${items.length === 1 ? "запись" : items.length < 5 ? "записи" : "записей"}` : "";

    for (const item of items) {
      const row = document.createElement("li");
      const card = document.createElement("article");
      card.className = "item-card";
      const top = document.createElement("div");
      top.className = "item-top";
      const description = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "item-title";
      title.textContent = item.title;
      const type = document.createElement("span");
      type.className = "type-label";
      type.textContent = typeNames[item.type];
      description.append(title, type);
      top.append(description);

      const controls = document.createElement("div");
      controls.className = "item-controls";
      const statusGroup = document.createElement("div");
      statusGroup.className = "control-group";
      const statusLabel = document.createElement("label");
      statusLabel.className = "control-label";
      statusLabel.textContent = "Статус";
      const status = document.createElement("select");
      status.setAttribute("aria-label", `Статус: ${item.title}`);
      status.append(makeOption("want", "Хочу", item.status === "want"), makeOption("done", "Готово", item.status === "done"));
      statusLabel.htmlFor = `status-${item.id}`;
      status.id = `status-${item.id}`;
      status.addEventListener("change", () => {
        item.status = status.value;
        saveItems();
        render();
      });
      statusGroup.append(statusLabel, status);

      const ratingGroup = document.createElement("div");
      ratingGroup.className = "control-group";
      const ratingLabel = document.createElement("label");
      ratingLabel.className = "control-label";
      ratingLabel.textContent = "Оценка";
      const rating = document.createElement("select");
      rating.id = `rating-${item.id}`;
      ratingLabel.htmlFor = rating.id;
      rating.setAttribute("aria-label", `Оценка: ${item.title}`);
      rating.append(makeOption("", "Не оценено", item.rating === null));
      for (let star = 1; star <= 5; star += 1) rating.append(makeOption(String(star), `${star} ${star === 1 ? "звезда" : star < 5 ? "звезды" : "звёзд"}`, item.rating === star));
      rating.addEventListener("change", () => {
        item.rating = rating.value ? Number(rating.value) : null;
        saveItems();
        render();
      });
      const ratingView = document.createElement("p");
      ratingView.className = "rating-view";
      if (item.rating === null) {
        ratingView.textContent = "не оценено";
      } else {
        const stars = document.createElement("span");
        stars.className = "stars";
        stars.setAttribute("aria-label", `${item.rating} из 5 звёзд`);
        stars.textContent = "★".repeat(item.rating) + "☆".repeat(5 - item.rating);
        ratingView.append(stars);
      }
      ratingGroup.append(ratingLabel, rating, ratingView);
      controls.append(statusGroup, ratingGroup);
      card.append(top, controls);
      row.append(card);
      list.append(row);
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
    items.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, title, type: typeInput.value, status: "want", rating: null });
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
