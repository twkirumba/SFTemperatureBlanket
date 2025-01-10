import { LightningElement, api } from 'lwc';
import createBlanketForSchemeAndDateWeather from '@salesforce/apex/BlanketAppService.createBlanketForSchemeAndDateWeather';


export default class BlanketApp_Preview extends LightningElement {
    @api listOfAccounts;
    @api year;
    listOfBlanketRows;
    listOfBlanketRowsError;

    connectedCallback(){
        this.wire_PreviewBlanket();
    }

    wire_PreviewBlanket(){
        createBlanketForSchemeAndDateWeather({ colorSchemeItemList: this.listOfAccounts, year: this.year })
            .then(data => {
                console.log(JSON.stringify(data));
                this.createBlanketRows(data);
            })
            .catch(error => {
                //console.log(JSON.stringify(error));
                this.listOfBlanketRowsError = JSON.stringify(error);
            }); 
    }

    createBlanketRows(data){
        console.log('setColumnStyle start');
        //console.log(JSON.stringify(data[0]));
        //console.log(JSON.stringify(data[0].Color_Scheme_Item__r.Color__c));
        this.listOfBlanketRows = [];
        data.forEach((item, index) => {
            this.listOfBlanketRows.push({
                data: item,
                columnStyle: 'text-align: left; border: 0.5px solid white; border-collapse: collapse; font-size: 13px; line-height: 1; height: 350px; max-width: 1%; padding: 2px; background-color: ' + item.Color_Scheme_Item__r.Color__c + ';',
                index: index
            });
            });
        console.log('example columnStyle --> ' + this.listOfBlanketRows[1].columnStyle);
    }
}