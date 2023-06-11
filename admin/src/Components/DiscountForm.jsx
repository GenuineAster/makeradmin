import React from 'react';
import TextInput from "./TextInput";
import Textarea from "./Textarea";
import DateTimeInput from "./DateTimeInput";
import * as _ from "underscore";
import SelectInput from "./SelectInput";
import ReactSelect from "react-select";
import CheckboxInput from "./CheckboxInput";

class DiscountForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            actions: [],
            availableActionTypes: [],
            selectedActionType: null,
            saveDisabled: true,
        };
    }

    componentDidMount() {
        const {discount} = this.props;
        this.unsubscribe = discount.subscribe(() => this.setState(discountChanged));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const {discount, onDelete, onSave} = this.props;
        const {actions, availableActionTypes, selectedActionType, saveDisabled} = this.state;

        const renderAction = action => (
            <div key={action.action_type} className="form-row uk-grid">
                <div className="uk-with-1-6">{action.action_type}</div>
                <div className="uk-with-1-6"><strong>Värde</strong></div>
                <div className="uk-with-3-6"><TextInput model={action} label={false} formrow={false} name={"value"}/></div>
                <div className="uk-with-1-6">
                    <a className="uk-button uk-button-danger" onClick={() => discount.removeAction(action)}><i className="uk-icon-trash-o"/></a>
                </div>
            </div>
        );

        const imageSrc = o => `data:${o.type};base64, ` + o.data;

        return (
            <div className="uk-margin-top">
                <form className="uk-form uk-form-stacked" onSubmit={(e) => {e.preventDefault(); onSave(); return false;}}>
                    <fieldset className="uk-margin-top">
                        <legend><i className="uk-icon-shopping-cart"/> Produkt</legend>
                        <TextInput model={discount} name="name" title="Produktnamn" />
                        <SelectInput model={discount} name="category_id" title="Kategori" getLabel={o => o.name} getValue={o => o.id} dataSource={"/webshop/category"} />
                        <Textarea model={discount} name="description" title="Beskrivning" rows="4"/>
                        <TextInput model={discount} name="unit" title="Enhet" />
                        <TextInput model={discount} name="price" title="Pris (SEK)" type="number"/>
                        <TextInput model={discount} name="smallest_multiple" title="Multipel " type="number"/>
                        <SelectInput
                            nullOption={{id: 0}}
                            model={discount} name="image_id" title="Bild"
                            getLabel={o => <div style={{height: "40px", width: "40px"}}>{ o.id ? <img src={imageSrc(o)} style={{verticalAlign: "middle", height: "100%"}} alt={o.name}/> : ""}</div>}
                            getValue={o => o.id} dataSource={"/webshop/discount_image"}
                        />
                    </fieldset>
                    <fieldset className="uk-margin-top">
                        <legend><i className="uk-icon-magic"/> Åtgärder</legend>
                        <div>
                            {actions.map(renderAction)}
                        </div>
                        {
                            _.isEmpty(availableActionTypes)
                            ?
                            ""
                            :
                            <div>
                                 <ReactSelect className="uk-width-3-5 uk-float-left"
                                             value={{value: selectedActionType, label: selectedActionType}}
                                             options={availableActionTypes.map(a => ({value: a, label: a}))}
                                             onChange={o => this.setState({selectedActionType: o.value})}
                                />
                                <button type="button" className="uk-button uk-button-success uk-float-right" onClick={() => discount.addAction(new ProductAction({action_type: selectedActionType}))}><i className="uk-icon-plus"/> Lägg till åtgärd</button>
                            </div>
                        }
                    </fieldset>
                    <fieldset className="uk-margin-top">
                        <legend><i className="uk-icon-filter"/> Filter</legend>
                        <SelectInput model={discount} name="filter" title="Filter" getLabel={o => o.name} getValue={o => o.id} options={[{id: "", name: "No filter"}, {id: "start_package", name: "Startpaket"}]}/>
                    </fieldset>
                    <fieldset className="uk-margin-top">
                        <legend><i className="uk-icon-tag"/> Metadata</legend>
                        <CheckboxInput model={discount} name="show" title="Synlig"/>
                        {
                            discount.id
                            ?
                            <>
                                <DateTimeInput model={discount} name="created_at" title="Skapad"/>
                                <DateTimeInput model={discount} name="updated_at" title="Uppdaterad"/>
                            </>
                            :
                            ""
                        }
                    </fieldset>
                    <fieldset className="uk-margin-top">
                        {discount.id ? <a className="uk-button uk-button-danger uk-float-left" onClick={onDelete}><i className="uk-icon-trash"/> Ta bort produkt</a> : ""}
                        <button disabled={saveDisabled} className="uk-button uk-button-success uk-float-right"><i className="uk-icon-save"/> {discount.id ? 'Spara' : 'Skapa'}</button>
                    </fieldset>
                </form>
            </div>
        );
    }
}



export default DiscountForm;
