import { LightningElement, api, wire, track } from 'lwc';
import COLOR_SCHEME_NAME from "@salesforce/schema/Color_Scheme__c.Name";
import COLOR_SCHEME_ITEM_NAME from "@salesforce/schema/Color_Scheme_Item__c.Name";
import COLOR_SCHEME_ITEM_MINTEMP from "@salesforce/schema/Color_Scheme_Item__c.Min_Temp__c";
import COLOR_SCHEME_ITEM_MAXTEMP from "@salesforce/schema/Color_Scheme_Item__c.Max_Temp__c";
import COLOR_SCHEME_ITEM_COLORHEX from "@salesforce/schema/Color_Scheme_Item__c.Color__c";
import COLOR_SCHEME_ITEM_COLORNAME from "@salesforce/schema/Color_Scheme_Item__c.Color_Name__c";
import createBlanketForSchemeAndDateWeather from '@salesforce/apex/BlanketAppService.createBlanketForSchemeAndDateWeather';

import {ShowToastEvent} from "lightning/platformShowToastEvent";


export default class BlanketApp_PlanBlanket extends LightningElement {

    @api colorSchemeName;
    @api previewBlanket;
    @track listOfAccounts;
    @track listOfBlanketRows;
    @track listOfBlanketRowsError = false;
    index;
    


    connectedCallback() {
        this.initData();
        this.previewBlanket = false;
    }
    initData() {
        let listOfAccounts = [];
        this.createRow(listOfAccounts);
        this.createSampleRows(listOfAccounts);
        this.listOfAccounts = listOfAccounts;
    }
    createSampleRows(listOfAccounts){
        //add two sample rows to listOfAccounts
        let sampleRows = [
            {
                index : listOfAccounts[listOfAccounts.length - 1].index + 1,
                Min_Temp__c : -100.00,
                Max_Temp__c : 20,
                Color__c : '#1158BA',
                Color_Name__c : 'Blue Whale'
            },
            {
                index : listOfAccounts[listOfAccounts.length - 1].index + 2,
                Min_Temp__c : 21.00,
                Max_Temp__c : 200.00,
                Color__c : '#D0BB76',
                Color_Name__c : 'Wheat'
            }
        ];
        Array.prototype.push.apply(listOfAccounts, sampleRows);
        console.log('listOfAccounts --> ' + JSON.stringify(listOfAccounts));
    }
    createRow(listOfAccounts) {
        let accountObject = {};
        if(listOfAccounts.length > 0) {
            accountObject.index = listOfAccounts[listOfAccounts.length - 1].index + 1;
        } else {
            accountObject.index = 1;
        }
        accountObject.Min_Temp__c = null;
        accountObject.Max_Temp__c = null;
        accountObject.Color__c = null;
        accountObject.Color_Name__c = null;
        console.log('accountObject --> ' + JSON.stringify(accountObject));
        listOfAccounts.push(accountObject);
    }
    /**
     * Adds a new row
     */
    addNewRow() {
        this.createRow(this.listOfAccounts);
    }
    /**
     * Removes the selected row
     */
    removeRow(event) {
        let toBeDeletedRowIndex = event.target.name;
        let listOfAccounts = [];
        for(let i = 0; i < this.listOfAccounts.length; i++) {
            let tempRecord = Object.assign({}, this.listOfAccounts[i]); //cloning object
            if(tempRecord.index !== toBeDeletedRowIndex) {
                listOfAccounts.push(tempRecord);
            }
        }
        for(let i = 0; i < listOfAccounts.length; i++) {
            listOfAccounts[i].index = i + 1;
        }
        this.listOfAccounts = listOfAccounts;
    }
    /**
     * Removes all rows
     */
    removeAllRows() {
        let listOfAccounts = [];
        this.createRow(listOfAccounts);
        this.listOfAccounts = listOfAccounts;
    }
    handleInputChange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        for(let i = 0; i < this.listOfAccounts.length; i++) {
            if(this.listOfAccounts[i].index === parseInt(index)) {
                this.listOfAccounts[i][fieldName] = value;
            }
        }
        if(this.previewBlanket == true){
            this.wire_PreviewBlanket(null);
        }
    }
    handlePreviewBlanket(){
        this.previewBlanket = !this.previewBlanket;
        this.wire_PreviewBlanket();
        
    }
    wire_PreviewBlanket(){
        createBlanketForSchemeAndDateWeather({ colorSchemeItemList: this.listOfAccounts, year: 2022 })
            .then(data => {
                //console.log(JSON.stringify(data));
                this.createBlanketRows(data);
            })
            .catch(error => {
                //console.log(JSON.stringify(error));
                this.listOfBlanketRowsError = JSON.stringify(error);
            }); 
    }
    createBlanketRows(data){
        console.log('setColumnStyle start');
        console.log(JSON.stringify(data[0]));
        console.log(JSON.stringify(data[0].Color_Scheme_Item__r.Color__c));
        this.listOfBlanketRows = [];
        data.forEach((item, index) => {
            this.listOfBlanketRows.push({
                data: item,
                columnStyle: 'border: 1px solid white; border-collapse: collapse; font-size: 15px; line-height: 1px; height: 200px; width: 1px; background-color: ' + item.Color_Scheme_Item__r.Color__c + ';',
                index: index
            });
            /*
            console.log(item);
            item.columnStyle = 'height: 150px; width: 2px; background-color: ' + item.Color_Scheme_Item__r.Color__c;
            console.log(item);
            data[index] = item;
            */
          });
        console.log('example columnStyle --> ' + this.listOfBlanketRows[1].columnStyle);
    }


}