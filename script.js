// ==========================================================================
// 1. SELECT DOM ELEMENTS
// ==========================================================================
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const taskCounter = document.getElementById("taskCounter");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll(".filter-btn");

// ==========================================================================
// 2. STATE MANAGEMENT & LOCAL STORAGE
// ==========================================================================
// Array to store task objects: { id, text, completed }
let tasks = JSON.parse(localStorage.getItem("dayloom_tasks")) || [];

// Track active filter state: "all", "active", or "completed"
let currentFilter = "all";

// Save tasks array to browser localStorage
function saveTasks() {
  localStorage.setItem("dayloom_tasks", JSON.stringify(tasks));
}

// ==========================================================================
// 3. CORE RENDER FUNCTION
// ==========================================================================
function render() {
  // Clear existing list items before rendering
  taskList.innerHTML = "";

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  // Inject task items into HTML
  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <div class="task-content">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? "checked" : ""} 
          data-id="${task.id}"
        />
        <span class="task-text">${escapeHTML(task.text)}</span>
      </div>
      <button class="delete-btn" data-id="${task.id}">Delete</button>
    `;

    taskList.appendChild(li);
  });

  // Update header progress and footer metrics
  updateProgress();
  updateCounter();
}

// Utility function to sanitize user text (prevents XSS)
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
}

// ==========================================================================
// 4. PROGRESS & METRICS UPDATES
// ==========================================================================
function updateProgress() {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    progressBar.style.width = "0%";
    progressText.textContent = "0% woven";
    return;
  }

  const completedTasks = tasks.filter((task) => task.completed).length;
  const percentage = Math.round((completedTasks / totalTasks) * 100);

  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}% woven`;
}

function updateCounter() {
  const remainingTasks = tasks.filter((task) => !task.completed).length;
  taskCounter.textContent = `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} remaining`;
}

// ==========================================================================
// 5. EVENT LISTENERS
// ==========================================================================

// Add New Task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  render();

  taskInput.value = "";
});

// Handle Clicks inside Task List (Toggle Completion & Delete)
taskList.addEventListener("click", (e) => {
  const id = Number(e.target.dataset.id);

  // Toggle Checkbox
  if (e.target.classList.contains("task-checkbox")) {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: e.target.checked } : task
    );
    saveTasks();
    render();
  }

  // Delete Item
  if (e.target.classList.contains("delete-btn")) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    render();
  }
});

// Switch Filter Tabs
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentFilter = button.dataset.filter;
    render();
  });
});

// Clear All Completed Tasks
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

// ==========================================================================
// 6. INITIAL APPLICATION LOAD
// ==========================================================================
render();

// Register Service Worker for PWA / Installability
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(() => console.log("DayLoom PWA Ready"))
    .catch((err) => console.log("SW Registration Failed:", err));
}