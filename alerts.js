// alerts.js: Stock Alerts page.
// TODO: when front-end and back-end are separate repos, set this to the
// back-end URL, e.g. "http://localhost/brewstock-backend/php/".
const API_BASE = "php/";

const alertsGrid = document.getElementById("alertsGrid");
const severityFilter = document.getElementById("severityFilter");
const refreshBtn = document.getElementById("refreshBtn");

let alerts = [];

// Item names come from the database, so escape them before using innerHTML.
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatNumber(n) {
    return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatCategory(category) {
    const names = {
        beans: "Beans & espresso",
        dairy: "Dairy & alternatives",
        syrups: "Flavorings & syrups",
        consumables: "Consumables",
        food: "Pastries & food"
    };
    return names[category] || category;
}

function formatDaysLeft(days) {
    if (days === null) return `<span class="muted">No usage data yet</span>`;
    if (days < 1) return "Under 1 day";
    return `${formatNumber(days)} <span>days</span>`;
}

function renderSummary(summary) {
    document.getElementById("criticalCount").textContent = summary.critical;
    document.getElementById("lowCount").textContent = summary.low;
    document.getElementById("totalAlerts").textContent = summary.total_alerts;
    document.getElementById("windowNote").textContent =
        `Days to stockout uses the last ${summary.window_days} days of usage`;
}

function renderAlerts() {
    const severity = severityFilter.value;
    const visible = alerts.filter((a) => severity === "all" || a.status === severity);

    if (alerts.length === 0) {
        alertsGrid.innerHTML = `
            <div class="all-clear">
                Everything is above its reorder threshold.
                <small>New alerts appear here as stock drops.</small>
            </div>`;
        return;
    }

    if (visible.length === 0) {
        alertsGrid.innerHTML = `<p class="empty-message">No items match this filter.</p>`;
        return;
    }

    alertsGrid.innerHTML = visible.map(createAlertCard).join("");
}

function createAlertCard(item) {
    const isCritical = item.status === "critical";
    const statusClass = isCritical ? "critical" : "low";
    const statusText = isCritical ? "Critical" : "Low stock";

    // Bar shows current stock against the threshold (full bar = at threshold).
    const pct = item.min_threshold > 0
        ? Math.max(0, Math.min(100, (item.current_stock / item.min_threshold) * 100))
        : 0;

    return `
        <div class="inventory-card is-${statusClass}">
            <div class="card-top">
                <div>
                    <span class="category">${escapeHtml(formatCategory(item.category))}</span>
                    <h3>${escapeHtml(item.item_name)}</h3>
                </div>
                <span class="status ${statusClass}">● ${statusText}</span>
            </div>

            <div class="stock-info">
                <div>
                    <small>Current stock</small>
                    <strong>${formatNumber(item.current_stock)} <span>${escapeHtml(item.unit)}</span></strong>
                </div>
                <div>
                    <small>Min threshold</small>
                    <strong>${formatNumber(item.min_threshold)} <span>${escapeHtml(item.unit)}</span></strong>
                </div>
            </div>

            <div class="capacity">
                <div class="capacity-label">
                    <span>Stock vs threshold</span>
                    <strong>${Math.round(pct)}%</strong>
                </div>
                <div class="progress">
                    <div class="progress-bar ${statusClass}" style="width: ${pct}%"></div>
                </div>
            </div>

            <div class="alert-facts">
                <div>
                    <small>Short by</small>
                    <strong>${formatNumber(item.shortfall)} <span>${escapeHtml(item.unit)}</span></strong>
                </div>
                <div>
                    <small>Avg daily use</small>
                    <strong>${item.avg_daily_usage === null
                        ? `<span class="muted">–</span>`
                        : `${formatNumber(item.avg_daily_usage)} <span>${escapeHtml(item.unit)}</span>`}</strong>
                </div>
                <div>
                    <small>Runs out in</small>
                    <strong>${formatDaysLeft(item.days_to_stockout)}</strong>
                </div>
            </div>
        </div>`;
}

async function loadAlerts() {
    refreshBtn.disabled = true;
    try {
        const response = await fetch(API_BASE + "get_alerts.php");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load alerts.");
        }

        alerts = data.alerts;
        renderSummary(data.summary);
        renderAlerts();
    } catch (error) {
        console.error("Error loading alerts:", error);
        alertsGrid.innerHTML = `
            <p class="error-message">
                Couldn't load stock alerts. Check that the server and database are running, then refresh.
            </p>`;
    } finally {
        refreshBtn.disabled = false;
    }
}

severityFilter.addEventListener("change", renderAlerts);
refreshBtn.addEventListener("click", loadAlerts);

loadAlerts();
