//regex
const namePattern = /^[A-Za-z0-9\s:,\.\s|]+$/;


//function to check the inputs 
function isValidInput(inputs) {
    
    
    let result = {
        valid:true,
    };

    for (let input of inputs) {
        
        if (input.trim() === "") {
            result.valid = false;
            result.input = input;
            return result;
        }
        if (!namePattern.test(input)) {
            result.valid = false;
            result.input = input;
            return result;
        }
    }

    return result;

};

function addressValidation(houseName, town, address, city, state, pincode) {
    let result = {
        validation:true
    }
    
    if (houseName.trim() == '' || !namePattern.test(houseName)) {
        result.validation = false;
        result.input = 'housename'
        return result
    };

    if (town.trim() == '' || !namePattern.test(town)) {
        result.validation = false;
        result.input = 'town'
        return result
    };

    if (city.trim() == '' || !namePattern.test(city)) {
        result.validation = false;
        result.input = 'city'
        return result
    };

    if (state.trim() == '' || !namePattern.test(state)) {
        result.validation = false;
        result.input = 'state'
        return result
    };

    if (pincode.length !== 6) {
        result.validation = false;
        result.input = 'pincode';
        return result
    }

    if (address.trim() == '' ) {
        result.validation = false;
        result.input = 'address';
        return result
    }

    return result;
}


function productInputValidation(productName, price, brand, description, stock) {
    
    let result = {
        validation: true
    };

    if (productName.trim() == '' || !namePattern.test(productName)) {
        result.validation = false;
        result.input = 'productName';
        return result;
    };

    if (brand.trim() == '' || !namePattern.test(brand)) {
        result.validation = false;
        result.input = 'brand';
        return result;
    };

    if (description.trim() == '') {
        result.validation = false;
        result.input = 'description';
        return result;
    };

    if (stock < 0) {
        result.validation = false;
        result.input = 'stock';
        return result;
    }

    if (price < 1) {
        result.validation = false;
        result.input = 'price';
        return result;
    }

    return result;
}

function couponValidation(couponName,description,discount,limit) {
    let result = {
        validation: true
    };

    if (couponName.trim() == '' || !namePattern.test(couponName)) {
        result.validation = false;
        result.input = 'couponName';
        return result;
    };

    if (description.trim() == '') {
        result.validation = false;
        result.input = 'description';
        return result;
    };

    if (discount < 0 || discount >100) {
        result.validation = false;
        result.input = 'discount';
        return result;
    }

    if (limit < 0) {
        result.validation = false;
        result.input = 'limit';
        return result;
    }

    return result;
}

module.exports = { isValidInput, addressValidation, productInputValidation, couponValidation };