import { LightningElement, api } from 'lwc';

export default class BlanketApp_BlanketManager extends LightningElement {
    colorDate = new Date();
    avgTemp;
    colorName;
    @api recordId;

    handleDateChange(event) {
        this.colorDate = event.target.value;
    }
}