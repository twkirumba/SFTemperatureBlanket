import { LightningElement, api } from 'lwc';
import formFactorPropertyName from "@salesforce/client/formFactor";
import createBlanketForSchemeAndDateWeather from '@salesforce/apex/BlanketAppService.createBlanketForSchemeAndDateWeather';


export default class BlanketApp_Preview extends LightningElement {
    @api listOfAccounts;
    @api year;
    _lastKnitDateInput;
    @api 
    get lastKnitDateInput() {
        return this._lastKnitDateInput;
    }
    set lastKnitDateInput(value){
        this._lastKnitDateInput = value;
        if(this.blanketRowData){
            this.createBlanketRows();
        }
    }
    blanketRowData;
    listOfBlanketRows;
    listOfBlanketRowsError;
    scrollRatio = 0; 

    connectedCallback(){
        console.log('knitDateInput: ' + this._lastKnitDateInput);
        if(!this._lastKnitDateInput){
            this._lastKnitDateInput = new Date();
        }
        this.wire_PreviewBlanket();
    }

    wire_PreviewBlanket(){
        createBlanketForSchemeAndDateWeather({ colorSchemeItemList: this.listOfAccounts, year: this.year })
            .then(data => {
                //console.log(JSON.stringify(data));
                this.blanketRowData = data;
                this.createBlanketRows();
            })
            .then(() => {
                console.log('wire_PreviewBlanket - scrollRatio' + this.scrollRatio);
                this.setScroll();
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                this.listOfBlanketRowsError = JSON.stringify(error);
            }); 
    }

    createBlanketRows(){
        console.log('createBlanketRows start');
        this.listOfBlanketRows = [];
        const lastKnitDate = new Date(this._lastKnitDateInput);
        console.log('lastKnitDate: ' + lastKnitDate);
        this.blanketRowData.forEach((item, index) => {
            const rowDate = new Date(item.DateWeather__r.Date__c);
            console.log('rowDate: ' + rowDate);
            console.log(rowDate <= lastKnitDate);
            const borderColor = item.Color_Scheme_Item__r.Color__c;
            const backgroundColor = rowDate <= lastKnitDate ? borderColor : '#FFFFFF';
            const textColor = this.getTextColor(backgroundColor);
            const textDecoration = ''; //rowDate <= lastKnitDate ? 'line-through' : '';
            
            // Style based on date comparison
            const cellStyle = `text-align: left; border: 10px solid ${borderColor}; border-collapse: collapse; 
                 font-size: 13px; line-height: 1; height: 350px; min-width : 50px; 
                 padding: 2px; background-color: ${backgroundColor}; color: ${textColor};`;
    
            this.listOfBlanketRows.push({
                data: item,
                columnStyle: cellStyle,
                index: index,
                textStyle: `writing-mode: vertical-lr; transform: rotate(0deg); text-decoration: ${textDecoration};`,
            });
        });
        this.setScrollRatio();
        console.log(this.scrollRatio);
        this.setScroll();
    }

    setScrollRatio(){
        const beginningOfTheYear = new Date(new Date().getFullYear(), 0, 1);
        const lastDate = new Date(this.blanketRowData[this.blanketRowData.length - 1].DateWeather__r.Date__c);
        const lastKnitDate = new Date(this._lastKnitDateInput);
        this.scrollRatio = (lastKnitDate - beginningOfTheYear) / (lastDate - beginningOfTheYear);
    }

    setScroll(){
        const container = this.template.querySelector('.datatable-container');
        container.scrollLeft = (container.scrollWidth - container.clientWidth) * this.scrollRatio;
        console.log(container.scrollLeft);
    }

    getTextColor(backgroundColor) {
        // Convert hex to RGB
        const r = parseInt(backgroundColor.substr(1,2), 16);
        const g = parseInt(backgroundColor.substr(3,2), 16);
        const b = parseInt(backgroundColor.substr(5,2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black for light backgrounds, white for dark
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    handleCellHover(event) {
        const date = event.currentTarget.dataset.date;
        this.listOfBlanketRows = this.listOfBlanketRows.map(row => {
            if (row.data.DateWeather__r.Date__c === date) {
                return { ...row, showCheckbox: true };
            }
            return row;
        });
    }

    handleCellLeave(event) {
        const date = event.currentTarget.dataset.date;
        this.listOfBlanketRows = this.listOfBlanketRows.map(row => {
            if (row.data.DateWeather__r.Date__c === date) {
                return { ...row, showCheckbox: false };
            }
            return row;
        });
    }
    handleDateSelection(event){
        console.log('handleDateSelection: ' + JSON.stringify(event.target.dataset));
        const selectedDate = event.target.dataset.date;
        this.dispatchEvent(new CustomEvent('lastknitdatechange', {
            detail: selectedDate
        }));
        this.lastKnitDateInput = new Date(selectedDate);

    }
}