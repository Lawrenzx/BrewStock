// usage-waste.js: Usage & Waste page (report + waste log form).
// TODO: when front-end and back-end are separate repos, set this to the
// back-end URL, e.g. "http://localhost/brewstock-backend/php/".
const API_BASE = "php/";

const rangeFilter = document.getElementById("rangeFilter");
const itemSelect = document.getElementById("itemSelect");
const staffSelect = document.getElementById("staffSelect");
const wastedInput = document.getElementById("wastedInput");
const reasonInput = document.getElementById("reasonInput");
const saveBtn = document.getElementById("saveBtn");
const formMessage = document.getElementById("formMessage");

// Item names, reasons and staff names come from the database: escape them.
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatNumber(n) {
    return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPeso(n) {
    return "₱" + Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(mysqlTimestamp) {
    // "2025-10-04 13:45:00" -> local date/time
    const d = new Date(mysqlTimestamp.replace(" ", "T"));
    if (isNaN(d)) return mysqlTimestamp;
    return d.toLocaleString("en-PH", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
}

async function getJson(path) {
    const response = await fetch(API_BASE + path);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
}

/* ---------- Report ---------- */

function renderReport(report) {
    const s = report.summary;

    document.getElementById("itemsTracked").textContent = s.items_tracked;
    document.getElementById("itemsWithWaste").textContent = s.items_with_waste;
    document.getElementById("wasteCost").textContent = formatPeso(s.waste_cost);
    document.getElementById("wasteCostNote").textContent =
        s.waste_cost === 0 && s.items_with_waste > 0
            ? "Set unit costs to see this"
            : `Usage cost: ${formatPeso(s.usage_cost)}`;
    document.getElementById("topWaste").textContent = s.top_waste_item || "No waste logged";

    const byItemBody = document.getElementById("byItemBody");
    if (report.by_item.length === 0) {
        byItemBody.innerHTML = `<tr><td colspan="5" class="muted">Nothing logged in this period. Use the form to add the first record.</td></tr>`;
    } else {
        byItemBody.innerHTML = report.by_item.map((r) => {
            const level = r.waste_rate >= 20 ? "critical" : r.waste_rate >= 10 ? "low" : "";
            return `
                <tr>
                    <td><strong>${escapeHtml(r.item_name)}</strong></td>
                    <td class="num">${formatNumber(r.used)} <span class="unit">${escapeHtml(r.unit)}</span></td>
                    <td class="num">${formatNumber(r.wasted)} <span class="unit">${escapeHtml(r.unit)}</span></td>
                    <td>
                        <div class="rate">
                            <div class="progress"><div class="progress-bar ${level}" style="width:${Math.min(100, r.waste_rate)}%"></div></div>
                            <strong>${r.waste_rate}%</strong>
                        </div>
                    </td>
                    <td class="num">${formatPeso(r.waste_cost)}</td>
                </tr>`;
        }).join("");
    }

    const recentBody = document.getElementById("recentBody");
    if (report.recent.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="6" class="muted">No records in this period.</td></tr>`;
    } else {
        recentBody.innerHTML = report.recent.map((r) => `
            <tr>
                <td>${escapeHtml(formatDate(r.record_date))}</td>
                <td><strong>${escapeHtml(r.item_name)}</strong></td>
                <td class="num">${formatNumber(r.quantity_used)} <span class="unit">${escapeHtml(r.unit)}</span></td>
                <td class="num">${formatNumber(r.quantity_wasted)} <span class="unit">${escapeHtml(r.unit)}</span></td>
                <td class="${r.reason ? "" : "muted"}">${r.reason ? escapeHtml(r.reason) : "–"}</td>
                <td class="${r.recorded_by ? "" : "muted"}">${r.recorded_by ? escapeHtml(r.recorded_by) : "Removed staff"}</td>
            </tr>`).join("");
    }
}

async function loadReport() {
    try {
        renderReport(await getJson("get_usage_waste.php?range=" + encodeURIComponent(rangeFilter.value)));
    } catch (error) {
        console.error("Error loading report:", error);
        const msg = `<tr><td colspan="6" class="error-message">Couldn't load the report. Check that the server and database are running, then refresh.</td></tr>`;
        document.getElementById("byItemBody").innerHTML = msg;
        document.getElementById("recentBody").innerHTML = msg;
    }
}

/* ---------- Form dropdowns ---------- */

async function loadItems() {
    try {
        // Reuses groupmate's existing endpoint.
        const items = await getJson("get_inventory.php");
        itemSelect.innerHTML = items.length
            ? items
                .slice()
                .sort((a, b) => a.item_name.localeCompare(b.item_name))
                .map((i) => `<option value="${Number(i.item_id)}">${escapeHtml(i.item_name)} (${formatNumber(i.current_stock)} ${escapeHtml(i.unit)} left)</option>`)
                .join("")
            : `<option value="">No items yet</option>`;
    } catch (error) {
        console.error("Error loading items:", error);
        itemSelect.innerHTML = `<option value="">Couldn't load items</option>`;
    }
}

async function loadStaff() {
    try {
        const staff = await getJson("get_staff.php");
        staffSelect.innerHTML = staff.length
            ? staff.map((s) => `<option value="${Number(s.staff_id)}">${escapeHtml(s.full_name)}</option>`).join("")
            : `<option value="">No staff accounts yet</option>`;
    } catch (error) {
        console.error("Error loading staff:", error);
        staffSelect.innerHTML = `<option value="">Couldn't load staff</option>`;
    }
}

/* ---------- Save ---------- */

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message " + (type || "");
}

async function saveRecord() {
    const wasted = parseFloat(wastedInput.value) || 0;
    const reason = reasonInput.value.trim();

    // Quick checks for instant feedback; the server checks again.
    if (!itemSelect.value) return showMessage("Choose an item.", "error");
    if (!staffSelect.value) return showMessage("Choose who is recording this.", "error");
    if (wasted <= 0) return showMessage("Enter how much was wasted.", "error");
    if (!reason) return showMessage("Add a reason for the waste.", "error");

    saveBtn.disabled = true;
    showMessage("Saving…", "");

    try {
        const response = await fetch(API_BASE + "add_waste.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                item_id: Number(itemSelect.value),
                quantity_wasted: wasted,
                reason: reason,
                recorded_by: Number(staffSelect.value)
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save the record.");

        showMessage(`Saved the waste record for ${data.item_name}.`, "success");

        wastedInput.value = 0;
        reasonInput.value = "";

        await loadReport();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveBtn.disabled = false;
    }
}

rangeFilter.addEventListener("change", loadReport);
saveBtn.addEventListener("click", saveRecord);

loadReport();
loadItems();
loadStaff();
