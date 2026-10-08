let staffList = [];
let deleteTargetId = null;

const staffBody    = document.getElementById("staffBody");
const searchInput  = document.getElementById("searchInput");
const roleFilter   = document.getElementById("roleFilter");

const totalStaffEl    = document.getElementById("totalStaff");
const totalLeadsEl    = document.getElementById("totalLeads");
const totalBaristasEl = document.getElementById("totalBaristas");
const totalOtherEl    = document.getElementById("totalOther");

const addStaffModal   = document.getElementById("addStaffModal");
const openAddStaff    = document.getElementById("openAddStaff");
const closeAddStaff   = document.getElementById("closeAddStaff");
const cancelAddStaff  = document.getElementById("cancelAddStaff");
const addStaffForm    = document.getElementById("addStaffForm");
const addFormMessage  = document.getElementById("addFormMessage");

const editStaffModal  = document.getElementById("editStaffModal");
const closeEditStaff  = document.getElementById("closeEditStaff");
const cancelEditStaff = document.getElementById("cancelEditStaff");
const editStaffForm   = document.getElementById("editStaffForm");
const editFormMessage = document.getElementById("editFormMessage");

const deleteStaffModal   = document.getElementById("deleteStaffModal");
const closeDeleteStaff   = document.getElementById("closeDeleteStaff");
const cancelDeleteStaff  = document.getElementById("cancelDeleteStaff");
const confirmDeleteStaff = document.getElementById("confirmDeleteStaff");
const deleteConfirmText  = document.getElementById("deleteConfirmText");

async function loadStaff() {

    setTableState("loading");

    try {

        const response = await fetch("php/get_staff.php");

        if (!response.ok) {
            throw new Error("Failed to load staff.");
        }

        staffList = await response.json();

        renderTable(staffList);
        updateStats(staffList);

    } catch (error) {

        console.error(error);
        setTableState("error");

    }

}

function renderTable(items) {

    if (items.length === 0) {
        setTableState("empty");
        return;
    }

    staffBody.innerHTML = items.map(staff => `
        <tr data-id="${staff.staff_id}">

            <td>
                <div class="staff-name-cell">
                    <div class="staff-avatar ${getRoleClass(staff.role)}">
                        ${getInitials(staff.full_name)}
                    </div>
                    <strong>${escHtml(staff.full_name)}</strong>
                </div>
            </td>

            <td class="email-cell">
                ${escHtml(staff.email)}
            </td>

            <td>
                <span class="role-badge ${getRoleClass(staff.role)}">
                    <i class="${getRoleIcon(staff.role)}"></i>
                    ${escHtml(staff.role)}
                </span>
            </td>

            <td class="date-cell">
                ${formatDate(staff.created_at)}
            </td>

            <td class="actions-cell">
                <button
                    class="action-btn edit"
                    title="Edit"
                    onclick="openEditModal(${staff.staff_id})"
                >
                    <i class="bi bi-pencil"></i>
                </button>
                <button
                    class="action-btn delete"
                    title="Remove"
                    onclick="openDeleteModal(${staff.staff_id}, '${escAttr(staff.full_name)}')"
                >
                    <i class="bi bi-trash3"></i>
                </button>
            </td>

        </tr>
    `).join("");

}

function setTableState(state) {

    const states = {
        loading: `
            <tr>
                <td colspan="5" class="table-loading">
                    <i class="bi bi-arrow-repeat spin"></i>
                    Loading staff...
                </td>
            </tr>
        `,
        empty: `
            <tr>
                <td colspan="5" class="table-empty">
                    <i class="bi bi-people"></i>
                    No staff accounts found.
                </td>
            </tr>
        `,
        error: `
            <tr>
                <td colspan="5" class="table-error">
                    Unable to load staff. Check your connection.
                </td>
            </tr>
        `
    };

    staffBody.innerHTML = states[state] || "";

}

function updateStats(items) {

    totalStaffEl.textContent = items.length;

    totalLeadsEl.textContent =
        items.filter(s => s.role === "Cafe Lead").length;

    totalBaristasEl.textContent =
        items.filter(s => s.role === "Barista").length;

    totalOtherEl.textContent =
        items.filter(
            s => s.role !== "Cafe Lead" && s.role !== "Barista"
        ).length;

}

searchInput.addEventListener("input", applyFilters);
roleFilter.addEventListener("change", applyFilters);

function applyFilters() {

    const search = searchInput.value.toLowerCase().trim();
    const role   = roleFilter.value;

    const filtered = staffList.filter(staff => {

        const matchesSearch =
            staff.full_name.toLowerCase().includes(search) ||
            staff.email.toLowerCase().includes(search);

        const matchesRole =
            role === "all" || staff.role === role;

        return matchesSearch && matchesRole;

    });

    renderTable(filtered);

}

openAddStaff.addEventListener("click", () => {
    addStaffModal.classList.add("show");
});

closeAddStaff.addEventListener("click",  () => closeModal(addStaffModal, addStaffForm, addFormMessage));
cancelAddStaff.addEventListener("click", () => closeModal(addStaffModal, addStaffForm, addFormMessage));

addStaffModal.addEventListener("click", e => {
    if (e.target === addStaffModal) {
        closeModal(addStaffModal, addStaffForm, addFormMessage);
    }
});

addStaffForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const full_name = document.getElementById("staffName").value.trim();
    const email     = document.getElementById("staffEmail").value.trim();
    const role      = document.getElementById("staffRole").value;
    const password  = document.getElementById("staffPassword").value;
    const confirm   = document.getElementById("staffPasswordConfirm").value;

    if (password !== confirm) {
        showMessage(addFormMessage, "Passwords do not match.", "error");
        return;
    }

    try {

        const res = await fetch("php/add_staff.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name, email, password, role })
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showMessage(addFormMessage, "Staff account created!", "success");

        await loadStaff();

        setTimeout(() => closeModal(addStaffModal, addStaffForm, addFormMessage), 700);

    } catch (err) {
        showMessage(addFormMessage, err.message || "Failed to create account.", "error");
    }

});

function openEditModal(staffId) {

    const staff = staffList.find(s => s.staff_id == staffId);
    if (!staff) return;

    document.getElementById("editStaffId").value    = staff.staff_id;
    document.getElementById("editStaffName").value  = staff.full_name;
    document.getElementById("editStaffEmail").value = staff.email;
    document.getElementById("editStaffRole").value  = staff.role;
    document.getElementById("editStaffPassword").value = "";

    clearMessage(editFormMessage);

    editStaffModal.classList.add("show");

}

closeEditStaff.addEventListener("click",  () => closeModal(editStaffModal, editStaffForm, editFormMessage));
cancelEditStaff.addEventListener("click", () => closeModal(editStaffModal, editStaffForm, editFormMessage));

editStaffModal.addEventListener("click", e => {
    if (e.target === editStaffModal) {
        closeModal(editStaffModal, editStaffForm, editFormMessage);
    }
});

editStaffForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const staff_id  = document.getElementById("editStaffId").value;
    const full_name = document.getElementById("editStaffName").value.trim();
    const email     = document.getElementById("editStaffEmail").value.trim();
    const role      = document.getElementById("editStaffRole").value;
    const password  = document.getElementById("editStaffPassword").value;

    try {

        const res = await fetch("php/update_staff.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staff_id, full_name, email, role, password })
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showMessage(editFormMessage, "Staff account updated!", "success");

        await loadStaff();

        setTimeout(() => closeModal(editStaffModal, editStaffForm, editFormMessage), 700);

    } catch (err) {
        showMessage(editFormMessage, err.message || "Failed to update account.", "error");
    }

});

function openDeleteModal(staffId, name) {

    deleteTargetId = staffId;

    deleteConfirmText.textContent =
        `Are you sure you want to remove "${name}"? This cannot be undone.`;

    deleteStaffModal.classList.add("show");

}

closeDeleteStaff.addEventListener("click",  () => closeDeleteModal());
cancelDeleteStaff.addEventListener("click", () => closeDeleteModal());

deleteStaffModal.addEventListener("click", e => {
    if (e.target === deleteStaffModal) closeDeleteModal();
});

confirmDeleteStaff.addEventListener("click", async () => {

    if (!deleteTargetId) return;

    try {

        const res = await fetch("php/delete_staff.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staff_id: deleteTargetId })
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        closeDeleteModal();
        await loadStaff();

    } catch (err) {
        alert(err.message || "Failed to delete account.");
    }

});

function closeDeleteModal() {
    deleteStaffModal.classList.remove("show");
    deleteTargetId = null;
}

document.querySelectorAll(".toggle-pw").forEach(btn => {

    btn.addEventListener("click", function () {

        const targetId = this.dataset.target;
        const input    = document.getElementById(targetId);
        const icon     = this.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("bi-eye", "bi-eye-slash");
        } else {
            input.type = "password";
            icon.classList.replace("bi-eye-slash", "bi-eye");
        }

    });

});

function closeModal(modal, form, messageEl) {
    modal.classList.remove("show");
    if (form) form.reset();
    if (messageEl) clearMessage(messageEl);
}

function showMessage(el, text, type) {
    el.textContent = text;
    el.className = "form-message " + type;
}

function clearMessage(el) {
    el.textContent = "";
    el.className = "form-message";
}

function getInitials(name) {
    return name
        .split(" ")
        .slice(0, 2)
        .map(n => n[0])
        .join("")
        .toUpperCase();
}

function getRoleClass(role) {
    const map = {
        "Cafe Lead": "lead",
        "Barista":   "barista",
        "Manager":   "manager",
        "Staff":     "staff"
    };
    return map[role] || "staff";
}

function getRoleIcon(role) {
    const map = {
        "Cafe Lead": "bi bi-award",
        "Barista":   "bi bi-cup-hot",
        "Manager":   "bi bi-briefcase",
        "Staff":     "bi bi-person"
    };
    return map[role] || "bi bi-person";
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        year:  "numeric",
        month: "short",
        day:   "numeric"
    });
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escAttr(str) {
    return String(str).replace(/'/g, "\\'");
}

loadStaff();
