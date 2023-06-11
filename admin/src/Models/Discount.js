import Base from './Base';

export default class Discount extends Base {
    canSave() {
        return this.isDirty() && this.name.length;
    }

    deleteConfirmMessage() {
        return `Are you sure you want to delete discount "${this.name}"?`;
    }
}

Discount.model = {
    id: "id",
    root: "/webshop/discount",
    attributes: {
        created_at: null,
        updated_at: null,
        name: "",
        description: "",
        group_id: 0,
        product_id: 0,
        price: 0
    },
};
