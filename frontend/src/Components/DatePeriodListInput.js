import React from "react";
import {utcToday} from "../utils";
import DatePeriodInput from "./DatePeriodInput";
import DatePeriod from "../Models/DatePeriod";


export default class DatePeriodListInput extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {periods: []};
    }

    componentDidMount() {
        const {periods} = this.props;
        periods.subscribe(() => {
            this.setState({periods: periods.periods});
        });
    }
    
    render() {
        const {category} = this.props.periods;
        const {showHistoric} = this.props;
        const {periods} = this.state;
        
        const today = utcToday();
        const categoryTitle = {
            labaccess: "Labaccess",
            special_labaccess: "Access till lokalen (styrelsen etc)",
            membership: "Medlemsskap",
        };
        
        return (
            <div>
                <h4 className="uk-margin-top">{categoryTitle[category]}</h4>
                {periods.map(p => {
                    if (!showHistoric && p.end < today) {
                        return null;
                    }
                    return (
                        <div key={p.id}>
                            <DatePeriodInput key={p.id} period={p}/>
                            &nbsp;
                            <a onClick={() => this.props.periods.remove(p)} className="removebutton"><i className="uk-icon-trash"/></a>
                        </div>
                    );
                })}
                <button style={{marginTop: "2px"}} className="uk-button uk-button-small uk-button-success" onClick={() => {
                    this.props.periods.add(new DatePeriod({start: utcToday(), end: utcToday()}));
                }}>Lägg till period</button>
            </div>
        );
    }
}
