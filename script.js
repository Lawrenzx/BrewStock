
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {

    const searchValue = this.value.toLowerCase();

    const cards = document.querySelectorAll(".inventory-card");

    cards.forEach(function (card) {

        const itemName =
            card.querySelector("h3").textContent.toLowerCase();

        const category =
            card.querySelector(".category").textContent.toLowerCase();

        if (
            itemName.includes(searchValue) ||
            category.includes(searchValue)
        ) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }

    });

});



const categoryFilter =
    document.getElementById("categoryFilter");

categoryFilter.addEventListener("change", filterInventory);



const statusFilter =
    document.getElementById("statusFilter");

statusFilter.addEventListener("change", filterInventory);



function filterInventory() {

    const selectedCategory =
        categoryFilter.value;

    const selectedStatus =
        statusFilter.value;

    const cards =
        document.querySelectorAll(".inventory-card");


    cards.forEach(function (card) {

        const cardCategory =
            card.dataset.category;

        const cardStatus =
            card.dataset.status;


        const categoryMatch =
            selectedCategory === "all" ||
            selectedCategory === cardCategory;


        const statusMatch =
            selectedStatus === "all" ||
            selectedStatus === cardStatus;


        if (categoryMatch && statusMatch) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}




const navItems =
    document.querySelectorAll(".nav-item");


navItems.forEach(function (item) {

    item.addEventListener("click", function () {

        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });

        this.classList.add("active");

    });

});
