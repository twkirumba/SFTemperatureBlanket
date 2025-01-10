import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import COLOR_SCHEME_NAME from "@salesforce/schema/Color_Scheme__c.Name";
import COLOR_SCHEME_ITEM_NAME from "@salesforce/schema/Color_Scheme_Item__c.Name";
import COLOR_SCHEME_ITEM_MINTEMP from "@salesforce/schema/Color_Scheme_Item__c.Min_Temp__c";
import COLOR_SCHEME_ITEM_MAXTEMP from "@salesforce/schema/Color_Scheme_Item__c.Max_Temp__c";
import COLOR_SCHEME_ITEM_COLORHEX from "@salesforce/schema/Color_Scheme_Item__c.Color__c";
import COLOR_SCHEME_ITEM_COLORNAME from "@salesforce/schema/Color_Scheme_Item__c.Color_Name__c";
import createBlanketForSchemeAndDateWeather from '@salesforce/apex/BlanketAppService.createBlanketForSchemeAndDateWeather';
import saveColorScheme from '@salesforce/apex/BlanketAppService.saveColorScheme';
import getColorSchemesWithItemsById from '@salesforce/apex/BlanketAppService.getColorSchemesWithItemsById';

import {ShowToastEvent} from "lightning/platformShowToastEvent";


export default class BlanketApp_PlanBlanket extends NavigationMixin(LightningElement) {

    colorSchemeName;
    url;
    @api previewBlanket;
    @track listOfAccounts;
    @track listOfBlanketRows;
    @track listOfBlanketRowsError = false;
    index;
    @api recordId;
    baseYear = 2024;
    compareYear;
    compareYears = false;

    connectedCallback() {
        this.initData();
        this.previewBlanket = false;
    }
    initData() {
        let listOfAccounts = [];
        if(this.recordId) {
            this.loadDataFromRecordId();
        }
        else{
        this.createRow(listOfAccounts);
        this.createSampleRows(listOfAccounts);
        this.listOfAccounts = listOfAccounts;
        }
    }
    loadDataFromRecordId(){
        //wire_service: query colorscheme with colorschemeItems
        getColorSchemesWithItemsById({colorSchemeId: this.recordId})
            .then((data) => {
                this.colorSchemeName = data.Name;
                this.setListOfAccounts(data.Color_Scheme_Items__r)                
                console.log(data);
                console.log(JSON.stringify(data));
                console.dir(JSON.stringify(data));
            })
            .catch((error) => {
                console.dir(error);
                this.showNotification('Error', 'Failed to load color scheme', 'error')
            });
    }
    setListOfAccounts(colorSchemeItems){
        this.listOfAccounts = colorSchemeItems.map((item, index) => ({
            index: index,
            Min_Temp__c: parseFloat(item.Min_Temp__c.toFixed(2)),
            Max_Temp__c: parseFloat(item.Max_Temp__c.toFixed(2)),
            Color__c: item.Color__c,
            Color_Name__c: item.Color_Name__c,
            Id: item.Id
        }));
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
    handleNameChange(event){
        this.colorSchemeName = event.target.value;
    }
    handleYearChange(event){
        this[event.target.name] = event.target.value;
    }
    handleCompareYears(event){
        this.compareYears = !this.compareYears;
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
    }
    //TODO: If recordId, change this to update the existing record. 
    handleSaveColorScheme(){
        saveColorScheme({colorSchemeItemList : this.listOfAccounts, colorSchemeName : this.colorSchemeName, recordId: this.recordId})
            .then((data) =>{
                this.showSuccessMessage(data.Id);
                //use navigationmixing to construct a url to the created record
                //this.url = this.createRecordURL(data.Id);
                //this.showNotification('Success', 'Color Scheme saved. <a href="${url}">View Record</a>', 'success');
            })
            .catch((error) => {
                console.dir(error);
                this.showNotification('Error', 'Color Scheme was not saved', 'error')
            });

    }
    showSuccessMessage(recordId){
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view',
            },
        }).then((url) => {
            const event = new ShowToastEvent({
                title: 'Success!',
                message: 'Color Scheme Saved: {0}',
                messageData: [
                    {
                        url,
                        label: 'View Record',
                    },
                ],
                variant: 'success'
            });
            this.dispatchEvent(event);
        });
    }
    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
          title: title,
          message: message,
          variant: variant,
        });
        this.dispatchEvent(evt);
    }
}