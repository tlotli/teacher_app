import { BaseScreen } from "../utils/screen-base.js";
import { setScreenSignal } from "../api/config.js";
import { router } from "../router.js";
import { demeritApi } from "../api/demerits.js";
import { renderBottomNav } from "../components/navigation/BottomNav.js";
import { errorHandler } from "../utils/error-handler.js";
import { htmlEscape } from "../utils/html-escape.js";

export default class Demerits extends BaseScreen {
  constructor() {
    super();
    this.categories = [];
    this.demerits = [];
    this.selectedStudent = null;
    this.searchTimeout = null;
  }

  async render() {
    setScreenSignal(this.signal);
    renderBottomNav();

    const el = document.getElementById("screen-content");
    el.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="goBackBtn"><i class="bi bi-arrow-left"></i></button>
        <h1>Demerits & Merits</h1>
      </div>
      <div class="screen-body">
        <div class="screen-stack">

          <!-- Issue form -->
          <div class="card">
            <div class="card-body">
              <div style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Issue Demerit / Merit</div>

              <!-- Student search -->
              <div class="form-group" style="position:relative;">
                <label>Student</label>
                <div class="student-search-wrap">
                  <input type="text" id="studentSearch" class="form-control" placeholder="Search by name or admission no…" autocomplete="off" />
                  <div id="studentSearchResults" class="student-search-results" style="display:none;"></div>
                </div>
                <div id="selectedStudentBadge" style="display:none;" class="selected-student-badge">
                  <span id="selectedStudentName"></span>
                  <button type="button" id="clearStudent" class="clear-student-btn"><i class="bi bi-x"></i></button>
                </div>
              </div>

              <!-- Category -->
              <div class="form-group">
                <label>Category</label>
                <select id="categorySelect" class="form-control">
                  <option value="">Loading categories…</option>
                </select>
              </div>

              <!-- Type: demerit or merit -->
              <div class="form-group">
                <label>Type</label>
                <div class="demerit-type-pills">
                  <button type="button" class="demerit-type-pill active" data-type="demerit" id="typeDemerit">
                    <i class="bi bi-exclamation-triangle"></i> Demerit
                  </button>
                  <button type="button" class="demerit-type-pill" data-type="merit" id="typeMerit">
                    <i class="bi bi-star"></i> Merit
                  </button>
                </div>
              </div>

              <!-- Points -->
              <div class="form-group">
                <label>Points</label>
                <input type="number" id="points" class="form-control" placeholder="e.g. 5" min="1" max="100" value="5" />
              </div>

              <!-- Severity -->
              <div class="form-group" id="severityGroup">
                <label>Severity</label>
                <div class="demerit-type-pills">
                  <button type="button" class="severity-pill active" data-sev="low">Low</button>
                  <button type="button" class="severity-pill" data-sev="medium">Medium</button>
                  <button type="button" class="severity-pill" data-sev="high">High</button>
                </div>
              </div>

              <!-- Location -->
              <div class="form-group">
                <label>Location <span style="font-weight:400;color:var(--text-muted);font-size:12px;">(optional)</span></label>
                <input type="text" id="location" class="form-control" placeholder="e.g. Classroom 3A, Playground…" />
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label>Notes <span style="font-weight:400;color:var(--text-muted);font-size:12px;">(optional)</span></label>
                <textarea id="notes" class="form-control" rows="3" placeholder="Describe the incident…" style="resize:vertical;"></textarea>
              </div>

              <!-- Notify parent -->
              <div class="demerit-notify-row">
                <div>
                  <div style="font-size:14px;font-weight:600;">Notify parent</div>
                  <div style="font-size:12px;color:var(--text-muted);">Send this incident to the parent app</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="shouldNotify" checked />
                  <span class="toggle-track"></span>
                </label>
              </div>

              <button id="issueBtn" class="btn-primary" style="margin-top:16px;">
                <i class="bi bi-exclamation-triangle-fill"></i> Issue Demerit
              </button>
            </div>
          </div>

          <!-- Recent demerits list -->
          <div class="section-title">Recent</div>
          <div id="demeritList" class="stack-list">
            <div class="skeleton" style="height:72px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:72px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:72px;"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("goBackBtn")?.addEventListener("click", () => router.back());
    this._bindForm();
    await this._loadData();
  }

  async _loadData() {
    try {
      const [catsRes, demeritsRes] = await Promise.all([
        demeritApi.getCategories(),
        demeritApi.getDemerits(),
      ]);
      if (!this.isActive) return;

      this.categories = catsRes.data.data || [];
      this._renderCategories();

      const items = demeritsRes.data.data || [];
      this._renderDemeritList(items);
    } catch (err) {
      if (!this.isActive) return;
      document.getElementById("demeritList").innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load</p></div>`;
    }
  }

  _renderCategories() {
    const select = document.getElementById("categorySelect");
    if (!select) return;

    if (!this.categories.length) {
      select.innerHTML = '<option value="">No categories configured — ask your admin</option>';
      return;
    }

    select.innerHTML = '<option value="">Select a category</option>' +
      this.categories.map((c) => `<option value="${c.id}">${htmlEscape(c.name)}</option>`).join("");
  }

  _renderDemeritList(items) {
    const el = document.getElementById("demeritList");
    if (!el) return;

    if (!items.length) {
      el.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-shield-check"></i>
          <p>No demerits issued yet</p>
          <p class="empty-state-caption">Use the form above to issue a demerit or merit to a learner.</p>
        </div>`;
      return;
    }

    el.innerHTML = items.map((d) => {
      const isMerit = d.points < 0;
      const student = d.student;
      const name = student ? `${student.first_name} ${student.last_name}` : "Unknown";
      const cat = d.demerit_category?.name || "Uncategorised";
      const pts = Math.abs(d.points);
      const sev = d.severity || "low";
      const sevColors = { low: "#56b9ff", medium: "#ffb547", high: "#ff4f67" };
      const typeColor = isMerit ? "#1cbf84" : "#ff4f67";
      const typeIcon = isMerit ? "bi-star-fill" : "bi-exclamation-triangle-fill";
      const date = d.created_at ? new Date(d.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : "";

      return `
        <div class="card demerit-item" data-id="${d.id}">
          <div class="card-body" style="padding:14px 16px;">
            <div class="demerit-item-row">
              <div class="demerit-item-icon" style="background:${typeColor}20;color:${typeColor};">
                <i class="bi ${typeIcon}"></i>
              </div>
              <div class="demerit-item-content">
                <div class="demerit-item-name">${htmlEscape(name)}</div>
                <div class="demerit-item-meta">${htmlEscape(cat)} · <span style="color:${sevColors[sev]};font-weight:600;">${sev}</span></div>
              </div>
              <div class="demerit-item-trailing">
                <div class="demerit-pts" style="color:${typeColor};">${isMerit ? "+" : "-"}${pts}pts</div>
                <div class="demerit-date">${date}</div>
                <button class="remove-demerit-btn" data-id="${d.id}" title="Remove"><i class="bi bi-trash3"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    el.querySelectorAll(".remove-demerit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._remove(parseInt(btn.dataset.id));
      });
    });
  }

  _bindForm() {
    let selectedType = "demerit";
    let selectedSeverity = "low";

    // Type pills
    document.querySelectorAll(".demerit-type-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        selectedType = pill.dataset.type;
        document.querySelectorAll(".demerit-type-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");

        // Update issue button
        const btn = document.getElementById("issueBtn");
        if (btn) {
          if (selectedType === "merit") {
            btn.innerHTML = '<i class="bi bi-star-fill"></i> Issue Merit';
            btn.style.background = "linear-gradient(135deg, #0a7a4e, #1cbf84)";
          } else {
            btn.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> Issue Demerit';
            btn.style.background = "";
          }
        }

        // Hide severity for merits
        const sevGroup = document.getElementById("severityGroup");
        if (sevGroup) sevGroup.style.display = selectedType === "merit" ? "none" : "";
      });
    });

    // Severity pills
    document.querySelectorAll(".severity-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        selectedSeverity = pill.dataset.sev;
        document.querySelectorAll(".severity-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
      });
    });

    // Student search
    const searchInput = document.getElementById("studentSearch");
    searchInput?.addEventListener("input", () => {
      clearTimeout(this.searchTimeout);
      const q = searchInput.value.trim();
      if (q.length < 2) {
        document.getElementById("studentSearchResults").style.display = "none";
        return;
      }
      this.searchTimeout = setTimeout(() => this._searchStudents(q), 350);
    });

    // Clear student
    document.getElementById("clearStudent")?.addEventListener("click", () => {
      this.selectedStudent = null;
      document.getElementById("selectedStudentBadge").style.display = "none";
      document.getElementById("studentSearch").style.display = "";
      document.getElementById("studentSearch").value = "";
    });

    // Issue button
    document.getElementById("issueBtn")?.addEventListener("click", () => {
      this._submit(selectedType, selectedSeverity);
    });
  }

  async _searchStudents(q) {
    try {
      const res = await demeritApi.searchStudents(q);
      if (!this.isActive) return;
      const results = res.data.data || [];
      const el = document.getElementById("studentSearchResults");
      if (!el) return;

      if (!results.length) {
        el.innerHTML = '<div class="student-search-empty">No learners found</div>';
      } else {
        el.innerHTML = results.map((s) => {
          const cls = s.school_class?.name || "";
          return `
            <button type="button" class="student-result-item" data-id="${s.id}" data-admission="${htmlEscape(s.admission_no)}" data-name="${htmlEscape(`${s.first_name} ${s.last_name}`)}">
              <span class="student-result-name">${htmlEscape(`${s.first_name} ${s.last_name}`)}</span>
              <span class="student-result-meta">${htmlEscape(s.admission_no)}${cls ? ` · ${htmlEscape(cls)}` : ""}</span>
            </button>`;
        }).join("");

        el.querySelectorAll(".student-result-item").forEach((item) => {
          item.addEventListener("click", () => {
            this.selectedStudent = {
              id: item.dataset.id,
              admission_no: item.dataset.admission,
              name: item.dataset.name,
            };
            document.getElementById("selectedStudentName").textContent = item.dataset.name;
            document.getElementById("selectedStudentBadge").style.display = "flex";
            document.getElementById("studentSearch").style.display = "none";
            el.style.display = "none";
          });
        });
      }

      el.style.display = "block";
    } catch {
      /* silent */
    }
  }

  async _submit(selectedType, selectedSeverity) {
    if (!this.selectedStudent) {
      errorHandler.showError("Please select a student.");
      return;
    }

    const categoryId = document.getElementById("categorySelect")?.value;
    if (!categoryId) { errorHandler.showError("Please select a category."); return; }

    const rawPoints = parseInt(document.getElementById("points")?.value || "5");
    if (!rawPoints || rawPoints < 1) { errorHandler.showError("Please enter valid points (min 1)."); return; }

    const btn = document.getElementById("issueBtn");
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Issuing…';

    const points = selectedType === "merit" ? -rawPoints : rawPoints;

    try {
      await demeritApi.issue({
        admission_no:        this.selectedStudent.admission_no,
        demerit_category_id: parseInt(categoryId),
        points,
        severity:            selectedSeverity,
        location:            document.getElementById("location")?.value.trim() || null,
        notes:               document.getElementById("notes")?.value.trim() || null,
        should_notify:       document.getElementById("shouldNotify")?.checked ?? true,
      });

      if (!this.isActive) return;
      errorHandler.showSuccess(`${selectedType === "merit" ? "Merit" : "Demerit"} issued to ${this.selectedStudent.name}`);
      this._resetForm();

      // Refresh list
      const res = await demeritApi.getDemerits();
      if (this.isActive) this._renderDemeritList(res.data.data || []);
    } catch (err) {
      if (!this.isActive) return;
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : (err.response?.data?.message || "Failed to issue demerit");
      errorHandler.showError(msg);
    } finally {
      if (this.isActive && btn) {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    }
  }

  _resetForm() {
    this.selectedStudent = null;
    document.getElementById("selectedStudentBadge").style.display = "none";
    document.getElementById("studentSearch").style.display = "";
    document.getElementById("studentSearch").value = "";
    document.getElementById("points").value = "5";
    document.getElementById("location").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("studentSearchResults").style.display = "none";

    // Reset pills
    document.querySelectorAll(".demerit-type-pill").forEach((p) => p.classList.toggle("active", p.dataset.type === "demerit"));
    document.querySelectorAll(".severity-pill").forEach((p) => p.classList.toggle("active", p.dataset.sev === "low"));
    const btn = document.getElementById("issueBtn");
    if (btn) {
      btn.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> Issue Demerit';
      btn.style.background = "";
    }
    const sevGroup = document.getElementById("severityGroup");
    if (sevGroup) sevGroup.style.display = "";
  }

  async _remove(id) {
    if (!confirm("Remove this demerit record?")) return;
    try {
      await demeritApi.remove(id);
      if (!this.isActive) return;
      errorHandler.showSuccess("Demerit removed.");
      const res = await demeritApi.getDemerits();
      if (this.isActive) this._renderDemeritList(res.data.data || []);
    } catch {
      errorHandler.showError("Failed to remove demerit.");
    }
  }
}
