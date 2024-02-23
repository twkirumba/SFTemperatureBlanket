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
    @track listOfBlanketRowsError;
    index;


    connectedCallback() {
        this.initData();
        this.handlePreviewBlanket(null);
        this.previewBlanket = false;
    }
    initData() {
        let listOfAccounts = [];
        this.createRow(listOfAccounts);
        this.listOfAccounts = listOfAccounts;
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
    }
    handlePreviewBlanket(event){
        console.log(event);
        this.previewBlanket = !this.previewBlanket;
        console.log('listOfAccounts');
        console.log(JSON.stringify(this.listOfAccounts));
        //call wire function to generate blanket rows then
        createBlanketForSchemeAndDateWeather({ colorSchemeItemList: this.listOfAccounts, year: 2022 })
            .then(data => {
                console.log(JSON.stringify(data));
                this.listOfBlanketRows = data;
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                this.listOfBlanketRowsError = JSON.stringify(error);
            }); 
    }


}