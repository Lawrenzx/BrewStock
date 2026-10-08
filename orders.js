let ordersList    = [];
let inventoryList = [];
let deleteTargetId = null;
let viewTargetId   = null;

const ordersBody     = document.getElementById("ordersBody");
const searchInput    = document.getElementById("searchInput");
const statusFilter   = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");

// Stats
const statTotal    = document.getElementById("statTotal");
const statPending  = document.getElementById("statPending");
const statOrdered  = document.getElementById("statOrdered");
const statReceived = document.getElementById("statReceived");

// Add modal
const addOrderModal   = document.getElementById("addOrderModal");
const openAddOrder    = document.getElementById("openAddOrder");
const closeAddOrder   = document.getElementById("closeAddOrder");
const cancelAddOrder  = document.getElementById("cancelAddOrder");
const addOrderForm    = document.getElementById("addOrderForm");
const addOrderMessage = document.getElementById("addOrderMessage");
const orderItemSelect = document.getElementById("orderItem");
const orderUnitInput  = document.getElementById("orderUnit");

// View modal
const viewOrderModal   = document.getElementById("viewOrderModal");
const closeViewOrder   = document.getElementById("closeViewOrder");
const cancelViewOrder  = document.getElementById("cancelViewOrder");
const orderDetailGrid  = document.getElementById("orderDetailGrid");
const statusBtnGroup   = document.getElementById("statusBtnGroup");
const viewOrderMessage = document.getElementById("viewOrderMessage");

// Delete modal
const deleteOrderModal   = document.getElementById("deleteOrderModal");
const closeDeleteOrder   = document.getElementById("closeDeleteOrder");
const cancelDeleteOrder  = document.getElementById("cancelDeleteOrder");
const confirmDeleteOrder = document.getElementById("confirmDeleteOrder");
const deleteOrderText    = document.getElementById("deleteOrderText");

async function loadAll() {
    await Promise.all([loadInventory(), loadOrders()]);
}

async function loadInventory() {
    try {
        const res  = await fetch("php/get_inventory.php");
        inventoryList = await res.json();
        populateItemSelect();
    } catch (e) {
        console.error("Failed to load inventory:", e);
    }
}

async function loadOrders() {

    setTableState("loading");

    try {

        const res = await fetch("php/get_orders.php");

        if (!res.ok) throw new Error("Failed to load orders.");

        ordersList = await res.json();

        renderTable(ordersList);
        updateStats(ordersList);

    } catch (err) {

        console.error(err);
        setTableState("error");

    }
}

function populateItemSelect() {
    orderItemSelect.innerHTML =
        `<option value="">Select item</option>` +
        inventoryList.map(item =>
            `<option
                value="${item.item_id}"
                data-unit="${escAttr(item.unit)}"
            >
                ${escHtml(item.item_name)} (${escHtml(item.unit)})
            </option>`
        ).join("");
}

function renderTable(items) {

    if (items.length === 0) {
        setTableState("empty");
        return;
    }

    ordersBody.innerHTML = items.map(order => {

        const statusClass = order.status.toLowerCase();
        const canDelete   = order.status === "Pending" || order.status === "Cancelled";

        return `
            <tr data-id="${order.order_id}">

                <td>
                    <div class="order-item-cell">
                        <div class="order-item-icon">
                            <i class="${getCategoryIcon(order.category)}"></i>
                        </div>
                        <div>
                            <strong>${escHtml(order.item_name)}</strong>
                            <span>${formatCategory(order.category)}</span>
                        </div>
                    </div>
                </td>

                <td class="supplier-cell">${escHtml(order.supplier_name)}</td>

                <td class="qty-cell">
                    ${formatQty(order.quantity)}
                    <span>${escHtml(order.unit)}</span>
                </td>

                <td>
                    <span class="order-status ${statusClass}">
                        <i class="${getStatusIcon(order.status)}"></i>
                        ${escHtml(order.status)}
                    </span>
                </td>

                <td class="by-cell">
                    ${order.ordered_by_name ? escHtml(order.ordered_by_name) : '<span style="color:#c4b5ac">—</span>'}
                </td>

                <td class="date-cell">${formatDate(order.order_date)}</td>

                <td class="actions-cell">
                    <button
                        class="action-btn view"
                        title="View / Update"
                        onclick="openViewModal(${order.order_id})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>
                    <button
                        class="action-btn delete"
                        title="${canDelete ? 'Delete' : 'Cannot delete — not Pending or Cancelled'}"
                        onclick="${canDelete ? `openDeleteModal(${order.order_id})` : ''}"
                        ${canDelete ? '' : 'disabled'}
                    >
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>

            </tr>
        `;

    }).join("");
}

function setTableState(state) {
    const states = {
        loading: `<tr><td colspan="7" class="table-loading"><i class="bi bi-arrow-repeat spin"></i> Loading orders...</td></tr>`,
        empty:   `<tr><td colspan="7" class="table-empty"><i class="bi bi-cart"></i> No orders found.</td></tr>`,
        error:   `<tr><td colspan="7" class="table-error">Unable to load orders. Check your connection.</td></tr>`
    };
    ordersBody.innerHTML = states[state] || "";
}

function updateStats(items) {
    statTotal.textContent    = items.length;
    statPending.textContent  = items.filter(o => o.status === "Pending").length;
    statOrdered.textContent  = items.filter(o => o.status === "Ordered").length;
    statReceived.textContent = items.filter(o => o.status === "Received").length;
}

searchInput.addEventListener("input",    applyFilters);
statusFilter.addEventListener("change",  applyFilters);
categoryFilter.addEventListener("change", applyFilters);

function applyFilters() {

    const search   = searchInput.value.toLowerCase().trim();
    const status   = statusFilter.value;
    const category = categoryFilter.value;

    const filtered = ordersList.filter(order => {

        const matchSearch =
            order.item_name.toLowerCase().includes(search) ||
            order.supplier_name.toLowerCase().includes(search);

        const matchStatus =
            status === "all" || order.status === status;

        const matchCategory =
            category === "all" || order.category === category;

        return matchSearch && matchStatus && matchCategory;

    });

    renderTable(filtered);
}

openAddOrder.addEventListener("click", () => {
    addOrderModal.classList.add("show");
    clearMessage(addOrderMessage);
});

closeAddOrder.addEventListener("click",  () => closeAddModal());
cancelAddOrder.addEventListener("click", () => closeAddModal());

addOrderModal.addEventListener("click", e => {
    if (e.target === addOrderModal) closeAddModal();
});

orderItemSelect.addEventListener("change", function () {
    const selected = this.options[this.selectedIndex];
    orderUnitInput.value = selected.dataset.unit || "";
});

addOrderForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const item_id       = parseInt(orderItemSelect.value);
    const supplier_name = document.getElementById("orderSupplier").value.trim();
    const quantity      = parseFloat(document.getElementById("orderQty").value);
    const unit          = orderUnitInput.value.trim();
    const notes         = document.getElementById("orderNotes").value.trim();

    try {

        const res = await fetch("php/add_order.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id, supplier_name, quantity, unit, notes })
        });

        const result = await res.json();

        if (!result.success) throw new Error(result.message);

        showMessage(addOrderMessage, "Order placed successfully!", "success");

        await loadOrders();

        setTimeout(() => closeAddModal(), 700);

    } catch (err) {
        showMessage(addOrderMessage, err.message || "Failed to place order.", "error");
    }

});

function closeAddModal() {
    addOrderModal.classList.remove("show");
    addOrderForm.reset();
    orderUnitInput.value = "";
    clearMessage(addOrderMessage);
}

function openViewModal(orderId) {

    const order = ordersList.find(o => o.order_id == orderId);
    if (!order) return;

    viewTargetId = orderId;

    orderDetailGrid.innerHTML = `
        <div class="detail-item">
            <label>Item</label>
            <p>${escHtml(order.item_name)}</p>
        </div>
        <div class="detail-item">
            <label>Category</label>
            <p>${formatCategory(order.category)}</p>
        </div>
        <div class="detail-item">
            <label>Supplier</label>
            <p>${escHtml(order.supplier_name)}</p>
        </div>
        <div class="detail-item">
            <label>Quantity</label>
            <p>${formatQty(order.quantity)} ${escHtml(order.unit)}</p>
        </div>
        <div class="detail-item">
            <label>Ordered By</label>
            <p class="${order.ordered_by_name ? '' : 'muted'}">${order.ordered_by_name ? escHtml(order.ordered_by_name) : 'Not recorded'}</p>
        </div>
        <div class="detail-item">
            <label>Order Date</label>
            <p>${formatDate(order.order_date)}</p>
        </div>
        ${order.notes ? `
        <div class="detail-item full-width">
            <label>Notes</label>
            <p>${escHtml(order.notes)}</p>
        </div>` : ''}
    `;

    const statuses = ["Pending", "Ordered", "Received", "Cancelled"];
    const icons = {
        Pending:   "bi bi-clock",
        Ordered:   "bi bi-truck",
        Received:  "bi bi-check-circle",
        Cancelled: "bi bi-x-circle"
    };

    const isLocked = order.status === "Received" || order.status === "Cancelled";

    statusBtnGroup.innerHTML = statuses.map(s => `
        <button
            class="status-change-btn ${s.toLowerCase()} ${order.status === s ? 'active' : ''}"
            onclick="updateStatus(${order.order_id}, '${s}')"
            ${(isLocked || order.status === s) ? 'disabled' : ''}
        >
            <i class="${icons[s]}"></i>
            ${s}
        </button>
    `).join("");

    clearMessage(viewOrderMessage);

    viewOrderModal.classList.add("show");
}

async function updateStatus(orderId, newStatus) {

    const btns = statusBtnGroup.querySelectorAll("button");
    btns.forEach(b => b.disabled = true);

    try {

        const res = await fetch("php/update_order_status.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });

        const result = await res.json();

        if (!result.success) throw new Error(result.message);

        showMessage(
            viewOrderMessage,
            newStatus === "Received"
                ? "Order received! Inventory stock has been updated."
                : "Status updated successfully.",
            "success"
        );

        await loadOrders();

        const updated = ordersList.find(o => o.order_id == orderId);
        if (updated) openViewModal(orderId);

    } catch (err) {
        showMessage(viewOrderMessage, err.message || "Failed to update status.", "error");
        btns.forEach(b => b.disabled = false);
    }
}

closeViewOrder.addEventListener("click",  () => closeViewModal());
cancelViewOrder.addEventListener("click", () => closeViewModal());

viewOrderModal.addEventListener("click", e => {
    if (e.target === viewOrderModal) closeViewModal();
});

function closeViewModal() {
    viewOrderModal.classList.remove("show");
    viewTargetId = null;
    clearMessage(viewOrderMessage);
}

function openDeleteModal(orderId) {

    const order = ordersList.find(o => o.order_id == orderId);
    if (!order) return;

    deleteTargetId = orderId;

    deleteOrderText.textContent =
        `Delete the order for "${order.item_name}" from ${order.supplier_name}? This cannot be undone.`;

    deleteOrderModal.classList.add("show");
}

closeDeleteOrder.addEventListener("click",   () => closeDelModal());
cancelDeleteOrder.addEventListener("click",  () => closeDelModal());

deleteOrderModal.addEventListener("click", e => {
    if (e.target === deleteOrderModal) closeDelModal();
});

confirmDeleteOrder.addEventListener("click", async () => {

    if (!deleteTargetId) return;

    try {

        const res = await fetch("php/delete_order.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: deleteTargetId })
        });

        const result = await res.json();

        if (!result.success) throw new Error(result.message);

        closeDelModal();
        await loadOrders();

    } catch (err) {
        alert(err.message || "Failed to delete order.");
    }

});

function closeDelModal() {
    deleteOrderModal.classList.remove("show");
    deleteTargetId = null;
}

function showMessage(el, text, type) {
    el.textContent = text;
    el.className = "form-message " + type;
}

function clearMessage(el) {
    el.textContent = "";
    el.className = "form-message";
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

function formatQty(qty) {
    return Number(qty).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatCategory(cat) {
    const map = {
        beans:       "Beans & Espresso",
        dairy:       "Dairy & Alternatives",
        syrups:      "Flavorings & Syrups",
        consumables: "Consumables",
        food:        "Pastries & Food"
    };
    return map[cat] || cat;
}

function getCategoryIcon(cat) {
    const map = {
        beans:       "bi bi-cup-hot",
        dairy:       "bi bi-droplet-half",
        syrups:      "bi bi-cup-straw",
        consumables: "bi bi-bag",
        food:        "bi bi-basket2"
    };
    return map[cat] || "bi bi-box";
}

function getStatusIcon(status) {
    const map = {
        Pending:   "bi bi-clock",
        Ordered:   "bi bi-truck",
        Received:  "bi bi-check-circle-fill",
        Cancelled: "bi bi-x-circle"
    };
    return map[status] || "bi bi-circle";
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

loadAll();
