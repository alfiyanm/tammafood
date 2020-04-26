$(document).ready(function() {
    initProducts();
    var orderForm = $('#orderForm');
    var validator = orderForm.validate();
    orderForm.on('submit', function(e) {
        e.preventDefault();
        if (orderForm.valid()) {
            // add FB pixel here (Event: InitiateCheckout)
            if ( typeof fbq == 'function' ) {
                var dt = generatePixelData();
                fbq('track', 'InitiateCheckout', dt);
            }

            order();
        }
    });
    $('#orderModal').on('show.bs.modal', function (e) {
        // add FB pixel here (Event: AddToCart)
        if ( typeof fbq == 'function' ) {
            var dt = generatePixelData();
            delete dt.num_items;
            fbq('track', 'AddToCart', dt);
        }

        renderDetailPembelian();
    });
    $('#orderModal').on('hide.bs.modal', function (e) {
        validator.resetForm();
    });
});

var products = [];
var orders = [];

function initProducts() {
    var items = $('#products .item');
    $.each(items, function(i, el) {
        var item = $(el);
        var id = Number(item.data('id'));

        var product = {
            id: id,
            name: item.data('name'),
            price: Number(item.data('price')),
        };
        products.push(product);

        item.find('.btnAddToCart').on('click', function() { addItem(id); });
        item.find('.btnPlus').on('click', function() { addItem(id); });
        item.find('.btnMinus').on('click', function() { removeItem(id); });
    });
}

function findProduct(id) {
    return products.find(x => x.id === id);
}

function findItem(id) {
    return orders.find(x => x.id === id);
}

function addItem(id) {
    var product = findProduct(id);
    product.quantity = 1;

    var item = findItem(id);

    if (item === undefined) {
        orders.push(product);
    } else {
        updateQuantity(id, 1);
    }

    updateDom();
}

function removeItem(id) {
    var item = findItem(id);
    if (item === undefined) return true;

    updateQuantity(id, -1);
    updateDom();
}

function updateQuantity(id, quantity) {
    var i = orders.findIndex(el => el.id === id);
    var item = orders[i];
    var new_item = {
        ...item,
        quantity: item.quantity + quantity
    }

    if (new_item.quantity === 0) {
        orders.splice(i, 1);    
    } else {
        orders.splice(i, 1, new_item);
    }
}

function updateDom() {
    updateTotalPrice();
    updateProductDom();
}

function updateTotalPrice() {
    $('body').removeClass('cart_not_empty');
    $('#buttonOpenModal').attr('disabled', true);
    var total = 0;
    $.each(orders, function(i, el) {
        total += el.price * el.quantity;
    })

    $('#totalPrice').text(formatRupiah(total));

    if (total > 0) {
        $('body').addClass('cart_not_empty');
        $('#buttonOpenModal').attr('disabled', false);
    }
}

function updateProductDom() {
    var items = $('#products .item');
    $.each(items, function(i, el) {
        var item = $(el);
        item.removeClass('was_on_cart');

        var id = Number(item.data('id'));
        var find = findItem(id);
        
        if (find === undefined) return true;
        item.find('.item-quantity').text(find.quantity);
        item.addClass('was_on_cart');
    });
}

function formatRupiah(angka){
    var number_string = angka.toString(),
    split   		= number_string.split(','),
    sisa     		= split[0].length % 3,
    rupiah     		= split[0].substr(0, sisa),
    ribuan     		= split[0].substr(sisa).match(/\d{3}/gi);

    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if(ribuan){
        separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return 'Rp ' + rupiah;
}

function order() {
    var number = $('#whatsappDestinationNumber').data('value');
    var order = generateOrderText();

    var customerName = $('#customerName').val();
    var customerPhone = $('#customerPhone').val();
    var customerEmail = $('#customerEmail').val();
    var customerAddress = $('#customerAddress').val();

    var text = `Assalamu 'alaikum, Saya mau pesan:%0a${order}%0aMohon dikirimkan ke:%0aNama: *${customerName}*%0aNomor Telepon: *${customerPhone}*%0aEmail: *${customerEmail}*%0aAlamat: *${customerAddress}*%0a%0aTerimakasih.`;

    var url = `https://web.whatsapp.com/send?phone=${number}&text=${text}`;

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        url = `https://wa.me/${number}?text=${text}`;
    }

    window.location.href = url;
}

function generateOrderText() {
    var text = '';
    $.each(orders, function(i, el) {
        text += `*${el.name}* (${el.quantity})%0a`;
    })
    return text;
}

function renderDetailPembelian() {
    var total = 0;
    var html = '<div class="card"><table class="table table-cart-detail">';
    html += `<thead>
    <tr>
    <th>Item</th>
    <th class="text-right">Harga</th>
    </tr>
    </thead>
    <tbody>`;
    $.each(orders, function(i, el) {
        total += el.price * el.quantity;
        html += `<tr>
        <td>${el.name} (${el.quantity})</td>
        <td class="text-right">${formatRupiah(Number(el.quantity) * Number(el.price))}</td>
        </tr>`;
    })
    html += `</tbody></table>
    <div class="text-right border-top p-2">
    <div class="d-flex justify-content-between">
    <div><strong>Total Belanja</strong></div>
    <div><strong>${formatRupiah(total)}</strong></div>
    </div>
    </div>`;
    $('#detailPembelian').html(html);
}

function generatePixelData() {
    var data = {
        value: 0,
        currency: 'IDR',
        contents: [],
        num_items: 0
    }

    $.each(orders, function(i, el) {
        data.value += el.price * el.quantity;
        data.num_items += el.quantity;
        data.contents.push({
            name: el.name,
            price: el.price,
            quantity: el.quantity,
        });
    })

    return data;
}