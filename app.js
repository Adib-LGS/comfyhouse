// variables

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting the products
class Products {
    async getProducts() {
        try {
            let result = await fetch("products.json");
            let data = await result.json();

            let products = data.items;
            products = products.map(item => {
                const {
                    title,
                    price
                } = item.fields;

                const {
                    id
                } = item.sys;

                const image = item.fields.image.fields.file.url;

                return {
                    title,
                    price,
                    id,
                    image
                };
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}
// display products
//Quand on passe la souris sur les petites img de products
class UI {
    displayProducts(products) {
        let result = "";
        products.forEach(product => {
            result += `
        <!--single product -->
        <article class="product">
            <div class="img-container">
                <img
                 src=${product.image} 
                 alt="product"
                 class="product-img"
                 />
                <button class="bag-btn" data-id=${product.id}>
                    <i class="fas fa-shopping-cart"></i>
                    add to cart
                </button>
            </div>
            <h3>${product.title}</h3>
            <h4> $${product.price}</h4>
        </article>
        <!-- end of single products -->
        `;
        });
        productsDOM.innerHTML = result;
    }
    //Montrer que le buttons ad to cart et selectionné
    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            //Verifier si le buton et l'id match
            let inCart = cart.find(item => item.id === id);
            //logic quand on va appuier sur ad to cart pour apparaitre dans la list Cart
            //si L'item est deja dans la cart
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", event => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;
                // get product from products + l'amount de l'item select
                let cartItem = {
                    ...Storage.getProduct(id),
                    amount: 1
                };

                // add product to the cart
                cart = [...cart, cartItem];
                // save cart in local storage
                Storage.saveCart(cart);
                // set cart values
                this.setCartValues(cart);
                // display cart item
                this.addCartItem(cartItem);
                // show the cart (List des commandes)
                this.showCart();
            });
        });
    }
    //Add le montant des items dans le Panier cart
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        //Faire en sorte que le calcul du amount soit == a Float pas plus de 2 decimales
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item) {
        const div = document.createElement("div");
        // div presente dans le index.html cart-item ligne 59
        div.classList.add("cart-item");
        div.innerHTML = `<img src=${item.image}
        alt="product" />
    <div>
        <h4>${item.title}</h4>
        <h5>$${item.price}</h5>
        <span class="remove-item"
        data-id=${item.id}>remove</span>
    </div>
    <div>
        <i class="fas fa-chevron-up" data-id=${item.id}></i>
        <p class="item-amount">${item.amount}</p>
        <i class="fas fa-chevron-down" data-id=${item.id}></i>
    </div>`;
        cartContent.appendChild(div);
    }

    //Propriété CSS transapentBcg faire afficher la fenettre des commandes
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        //Fermer la fenetre de list commandes avec le bouton "X" avec callback function "showCart" "hideCart" ligne 136 et 152
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }
    cartLogic() {
        //Methode pour clear les items dans la cart List via "Clear Cart" Button
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });
        //removing items from cart "remove" dans la cart List commandes
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains("remove-item")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;

                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);

            } else if (event.target.classList.contains("fa-chevron-up")) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                //Change le nb d'items calculé entre les chevron up && down
                addAmount.nextElementSibling.innerText = tempItem.amount;

            } else if (event.target.classList.contains("fa-chevron-down")) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                //Block la régréssion a "0"
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }

    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        console.log(cartContent.children);
        //removing from the DOM
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

//local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    // if the method doesn't exist we gona get an empty array
    static getCart() {
        return localStorage.getItem('cart') ?
            JSON.parse(localStorage.getItem('cart')) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    // Appel de la Methode Setup application plus haut ligne 140
    ui.setupAPP();
    // get all products
    products
        .getProducts()
        .then(products => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
            //Recuperer l'article Selectione dans la Cart(Panier)
        })
        .then(() => {
            ui.getBagButtons();
            ui.cartLogic()
        });
});