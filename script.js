const inventoryGrid =
    document.getElementById("inventoryGrid");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const statusFilter =
    document.getElementById("statusFilter");



let inventory = [];

async function loadInventory() {

    try {

        const response =
            await fetch("php/get_inventory.php");

        if (!response.ok) {
            throw new Error(
                "Failed to load inventory."
            );
        }

        inventory =
            await response.json();

        console.log(
            "Inventory from database:",
            inventory
        );

        displayInventory(inventory);

        updateDashboard(inventory);

    } catch (error) {

        console.error(
            "Error loading inventory:",
            error
        );

        inventoryGrid.innerHTML = `
            <p class="error-message">
                Unable to load inventory.
            </p>
        `;

    }

}

function displayInventory(items) {

    inventoryGrid.innerHTML = "";


    if (items.length === 0) {

        inventoryGrid.innerHTML = `
            <p class="empty-message">
                No inventory items found.
            </p>
        `;

        return;
    }


    items.forEach(function(item) {

        const card =
            createInventoryCard(item);

        inventoryGrid.innerHTML += card;

    });

}

function createInventoryCard(item) {

    const currentStock =
        parseFloat(item.current_stock);

    const minThreshold =
        parseFloat(item.min_threshold);



    let capacity =
        (currentStock / (minThreshold * 5)) * 100;


    capacity =
        Math.max(0, Math.min(100, capacity));


   
    let statusText = "In Stock";
    let statusClass = "in-stock";

    if (item.status === "low") {

        statusText = "Low Stock";
        statusClass = "low";

    }

    if (item.status === "critical") {

        statusText = "Critical";
        statusClass = "critical";

    }


    return `

        <div
            class="inventory-card"
            data-category="${item.category}"
            data-status="${item.status}"
        >

            <div class="card-top">

                <div>

                    <span class="category">
                        ${formatCategory(item.category)}
                    </span>

                    <h3>
                        ${item.item_name}
                    </h3>

                </div>

                <div class="item-icon">
                    ${getItemIcon(item.category)}
                </div>

            </div>


            <div class="stock-info">

                <div>

                    <small>
                        Current Stock
                    </small>

                    <strong>
                        ${removeDecimal(currentStock)}
                        <span>
                            ${item.unit}
                        </span>
                    </strong>

                </div>


                <div>

                    <small>
                        Min Threshold
                    </small>

                    <strong>
                        ${removeDecimal(minThreshold)}
                        <span>
                            ${item.unit}
                        </span>
                    </strong>

                </div>

            </div>


            <div class="capacity">

                <div class="capacity-label">

                    <span>
                        Stock capacity
                    </span>

                    <strong>
                        ${Math.round(capacity)}%
                    </strong>

                </div>


                <div class="progress">

                    <div
                        class="progress-bar ${statusClass}"
                        style="width: ${capacity}%"
                    ></div>

                </div>

            </div>


            <span class="status ${statusClass}">
                ● ${statusText}
            </span>

        </div>

    `;

}

function formatCategory(category) {

    const categories = {

        beans: "BEANS & ESPRESSO",

        dairy: "DAIRY & ALTERNATIVES",

        syrups: "FLAVORINGS & SYRUPS",

        consumables: "CONSUMABLES",

        food: "PASTRIES & FOOD"

    };


    return categories[category]
        || category.toUpperCase();

}

function getItemIcon(category) {

    const icons = {

        beans: '<i class="bi bi-cup-hot"></i>',

        dairy: '<i class="bi bi-droplet-half"></i>',

        syrups: '<i class="bi bi-cup-straw"></i>',

        consumables: '<i class="bi bi-bag"></i>',

        food: '<i class="bi bi-basket2"></i>'

    };


    return icons[category]
        || '<i class="bi bi-box"></i>';

}

function removeDecimal(number) {

    return Number(number)
        .toLocaleString(
            "en-US",
            {
                maximumFractionDigits: 2
            }
        );

}

function updateDashboard(items) {

    const totalItems =
        document.getElementById("totalItems");

    const lowStock =
        document.getElementById("lowStock");

    const criticalItems =
        document.getElementById("criticalItems");

    const categoriesEl =
        document.getElementById("categories");


    totalItems.textContent =
        items.length;


    const lowCount =
        items.filter(
            item => item.status === "low"
        ).length;

    lowStock.textContent =
        lowCount;


    const criticalCount =
        items.filter(
            item => item.status === "critical"
        ).length;

    criticalItems.textContent =
        criticalCount;


    const uniqueCategories =
        new Set(items.map(item => item.category)).size;

    categoriesEl.textContent =
        uniqueCategories;

}

searchInput.addEventListener(
    "input",
    applyFilters
);

categoryFilter.addEventListener(
    "change",
    applyFilters
);

statusFilter.addEventListener(
    "change",
    applyFilters
);

function applyFilters() {

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedCategory =
        categoryFilter.value;


    const selectedStatus =
        statusFilter.value;


    const filtered =
        inventory.filter(function(item) {


            const matchesSearch =

                item.item_name
                    .toLowerCase()
                    .includes(searchValue)

                ||

                item.category
                    .toLowerCase()
                    .includes(searchValue);


            const matchesCategory =

                selectedCategory === "all"

                ||

                item.category ===
                selectedCategory;


            const matchesStatus =

                selectedStatus === "all"

                ||

                item.status ===
                selectedStatus;


            return (

                matchesSearch &&

                matchesCategory &&

                matchesStatus

            );

        });


    displayInventory(filtered);

}

loadInventory();

const addInventoryModal =
    document.getElementById("addInventoryModal");

const openAddInventory =
    document.getElementById("openAddInventory");

const closeAddInventory =
    document.getElementById("closeAddInventory");

const cancelAddInventory =
    document.getElementById("cancelAddInventory");

const addInventoryForm =
    document.getElementById("addInventoryForm");

const formMessage =
    document.getElementById("formMessage");

openAddInventory.addEventListener(
    "click",
    function () {

        addInventoryModal.classList.add("show");

    }
);

closeAddInventory.addEventListener(
    "click",
    closeInventoryModal
);


cancelAddInventory.addEventListener(
    "click",
    closeInventoryModal
);

addInventoryModal.addEventListener(
    "click",
    function(event) {

        if (event.target === addInventoryModal) {

            closeInventoryModal();

        }

    }
);


// Close function
function closeInventoryModal() {

    addInventoryModal.classList.remove("show");

    addInventoryForm.reset();

    formMessage.textContent = "";

    formMessage.className =
        "form-message";

}

addInventoryForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const itemName =
            document.getElementById("itemName").value.trim();

        const category =
            document.getElementById("itemCategory").value;

        const currentStock =
            parseFloat(
                document.getElementById("currentStock").value
            );

        const minThreshold =
            parseFloat(
                document.getElementById("minThreshold").value
            );

        const unit =
            document.getElementById("itemUnit").value;

        if (
            !itemName ||
            !category ||
            isNaN(currentStock) ||
            isNaN(minThreshold) ||
            !unit
        ) {

            showFormMessage(
                "Please complete all fields.",
                "error"
            );

            return;

        }


        if (currentStock < 0 || minThreshold < 0) {

            showFormMessage(
                "Stock values cannot be negative.",
                "error"
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "php/add_item.php",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            item_name:
                                itemName,

                            category:
                                category,

                            current_stock:
                                currentStock,

                            min_threshold:
                                minThreshold,

                            unit:
                                unit

                        })

                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                throw new Error(
                    result.message
                );

            }


            showFormMessage(
                "Inventory added successfully!",
                "success"
            );

            await loadInventory();

            setTimeout(
                closeInventoryModal,
                700
            );


        } catch (error) {

            console.error(error);

            showFormMessage(
                error.message ||
                "Failed to add inventory.",
                "error"
            );

        }

    }
);

function showFormMessage(
    message,
    type
) {

    formMessage.textContent =
        message;

    formMessage.className =
        "form-message " + type;

}