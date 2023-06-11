import React from 'react';
import OrderList from "./OrderList";
import OrderShow from "./OrderShow";
import ProductList from "./ProductList";
import ProductAdd from "./ProductAdd";
import ProductEdit from "./ProductEdit";
import DiscountList from "./DiscountList";
import DiscountAdd from "./DiscountAdd";
import DiscountEdit from "./DiscountEdit";
import CategoryList from "./CategoryList";
import { Route, Switch } from 'react-router-dom';
import ImageList from "./ImageList";

export default ({ match }) => (
    <Switch>
        <Route path={`${match.path}/`} exact component={OrderList} />
        <Route path={`${match.path}/order`} exact component={OrderList} />
        <Route path={`${match.path}/order/:id`} component={OrderShow} />
        <Route path={`${match.path}/product`} exact component={ProductList} />
        <Route path={`${match.path}/product/add`} component={ProductAdd} />
        <Route path={`${match.path}/product/:id`} component={ProductEdit} />
        <Route path={`${match.path}/category`} exact component={CategoryList} />
        <Route path={`${match.path}/image`} exact component={ImageList} />
        <Route path={`${match.path}/discount`} exact component={DiscountList} />
        <Route path={`${match.path}/discount/add`} component={DiscountAdd} />
        <Route path={`${match.path}/discount/:id`} component={DiscountEdit} />
    </Switch>
);
