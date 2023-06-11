import React from 'react';
import {withRouter} from "react-router";
import Discount from "../Models/Discount";
import DiscountForm from "../Components/DiscountForm";
import {confirmModal} from "../message";
import { browserHistory } from '../browser_history';


class DiscountEdit extends React.Component {
    constructor(props) {
        super(props);
        const {id} = props.match.params;
        this.discount = Discount.getWithRelated(id);
    }

    render() {
        return (
            <div>
                <h2>Edit discount</h2>
                <DiscountForm
                    discount={this.discount}
                    route={this.props.route}
                    onSave={() => this.discount.save()}
                    onDelete={() => {
                        return confirmModal(this.discount.deleteConfirmMessage())
                            .then(() => this.discount.del())
                            .then(() => {
                                browserHistory.push("/sales/discount/");
                            })
                            .catch(() => null);
                    }}
                />
            </div>
        );
    }
}

export default withRouter(DiscountEdit);
