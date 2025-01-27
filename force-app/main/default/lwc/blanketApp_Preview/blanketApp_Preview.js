import { LightningElement, api } from 'lwc';
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
        try{
            this.createBlanketRows();
        }catch(e){
            console.log(e);
        }
    }
    blanketRowData;
    listOfBlanketRows;
    listOfBlanketRowsError;

    connectedCallback(){
        this.wire_PreviewBlanket();
        console.log('knitDateInput: ' + this._lastKnitDateInput);
        if(!this._lastKnitDateInput){
            this._lastKnitDateInput = new Date();
        }
    }

    wire_PreviewBlanket(){
        createBlanketForSchemeAndDateWeather({ colorSchemeItemList: this.listOfAccounts, year: this.year })
            .then(data => {
                //console.log(JSON.stringify(data));
                this.blanketRowData = data;
                this.createBlanketRows();
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
            const backgroundColor = item.Color_Scheme_Item__r.Color__c;
            const textColor = this.getTextColor(backgroundColor);
            
            // Style based on date comparison
            const cellStyle = rowDate <= lastKnitDate ? 
                // Style for past/current dates - full color as before
                `text-align: left; border: 0.5px solid white; border-collapse: collapse; 
                 font-size: 13px; line-height: 1; height: 350px; max-width: 1%; 
                 padding: 2px; background-color: ${backgroundColor}; color: ${textColor};` :
                // Style for future dates - white background with colored border
                `text-align: left; border: 10px solid ${backgroundColor}; border-collapse: collapse; 
                 font-size: 13px; line-height: 1; height: 350px; max-width: 1%; 
                 padding: 2px; background-color: white; color: black;`;
    
            this.listOfBlanketRows.push({
                data: item,
                columnStyle: cellStyle,
                index: index
            });
        });
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
}