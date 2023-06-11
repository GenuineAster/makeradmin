import React from 'react';

import { browserHistory } from '../browser_history';
import Discount from "../Models/Discount";
import DiscountForm from "../Components/DiscountForm";


class DiscountAdd extends React.Component {
    constructor(props) {
        super(props);
        this.discount = new Discount();
    }

    render() {
        return (
            <div>
                <h2>Create discount</h2>
                <DiscountForm
                    product={this.discount}
                    onSave={() => this.product.save().then(() => browserHistory.replace('/sales/discount/' + this.discount.id))}
                />
            </div>
        );
    }
}

export default DiscountAdd;
